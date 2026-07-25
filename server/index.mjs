/**
 * ATL Ghetto Monopoly — static host + room-code multiplayer relay.
 *
 * The game logic runs entirely in the acting player's browser; this server only
 * stores the latest full-state snapshot per room and relays it to the other
 * players. Rooms live in memory, so run with max-instances=1 on Cloud Run.
 * A dropped client rejoins with its room code + seat and receives the latest
 * snapshot, so an instance restart only loses games nobody is connected to.
 */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const PORT = process.env.PORT || 8080;
const ROOM_TTL_MS = 6 * 60 * 60 * 1000; // rooms die after 6h of inactivity

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};

/** rooms: code -> { lobby: {seat,name,token}[], started, snapshot, sockets: Map<ws,seat>, touched } */
const rooms = new Map();

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no confusable 0/O/1/I/L
function newCode() {
  for (let tries = 0; tries < 50; tries++) {
    let code = '';
    for (let i = 0; i < 4; i++) code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    if (!rooms.has(code)) return code;
  }
  return null;
}

setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.touched > ROOM_TTL_MS && room.sockets.size === 0) rooms.delete(code);
  }
}, 10 * 60 * 1000).unref();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    let file = path.normalize(path.join(DIST, url.pathname === '/' ? 'index.html' : url.pathname));
    if (!file.startsWith(DIST)) {
      res.writeHead(403).end();
      return;
    }
    try {
      const st = await stat(file);
      if (st.isDirectory()) file = path.join(file, 'index.html');
    } catch {
      file = path.join(DIST, 'index.html'); // SPA fallback
    }
    const body = await readFile(file);
    const ext = path.extname(file);
    res.writeHead(200, {
      'Content-Type': MIME[ext] ?? 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    });
    res.end(body);
  } catch (e) {
    res.writeHead(500).end('server error');
  }
});

const wss = new WebSocketServer({ server, path: '/ws' });

const send = (ws, msg) => {
  if (ws.readyState === 1) ws.send(JSON.stringify(msg));
};

const broadcast = (room, msg, except) => {
  for (const ws of room.sockets.keys()) if (ws !== except) send(ws, msg);
};

const lobbyRoster = (room) => room.lobby.filter(Boolean);

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => (ws.isAlive = true));

  let joined = null; // { code, seat }

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    const room = msg.code ? rooms.get(String(msg.code).toUpperCase()) : null;

    switch (msg.t) {
      case 'create': {
        const code = newCode();
        if (!code) return send(ws, { t: 'error', error: 'Server is full, try again.' });
        const newRoom = { lobby: [], started: false, snapshot: null, sockets: new Map(), touched: Date.now() };
        newRoom.sockets.set(ws, 0);
        newRoom.lobby[0] = null; // seat reserved, unnamed until lobby msg
        rooms.set(code, newRoom);
        joined = { code, seat: 0 };
        send(ws, { t: 'joined', code, seat: 0, lobby: [], started: false, snapshot: null });
        return;
      }

      case 'join': {
        if (!room) return send(ws, { t: 'error', error: 'Game code not found.' });
        room.touched = Date.now();
        let seat = Number.isInteger(msg.seat) ? msg.seat : null;
        const seatTakenLive = seat !== null && [...room.sockets.values()].includes(seat);
        if (seat === null || seatTakenLive || seat >= 6) {
          if (room.started) {
            // Game already running: only reclaiming a seat nobody is connected to.
            const liveSeats = new Set(room.sockets.values());
            const free = room.lobby.map((_, i) => i).find((i) => !liveSeats.has(i));
            if (free === undefined) return send(ws, { t: 'error', error: 'Game already started.' });
            seat = free;
          } else {
            seat = 0;
            while (room.lobby[seat] !== undefined) seat++;
            if (seat >= 6) return send(ws, { t: 'error', error: 'Room is full (6 players).' });
            room.lobby[seat] = null; // claim
          }
        }
        room.sockets.set(ws, seat);
        if (room.lobby[seat] === undefined) room.lobby[seat] = null;
        joined = { code: String(msg.code).toUpperCase(), seat };
        send(ws, {
          t: 'joined',
          code: joined.code,
          seat,
          lobby: lobbyRoster(room),
          started: room.started,
          snapshot: room.snapshot,
        });
        broadcast(room, { t: 'lobby', lobby: lobbyRoster(room) }, ws);
        return;
      }

      case 'lobby': {
        if (!room || !joined) return;
        room.touched = Date.now();
        room.lobby[joined.seat] = { seat: joined.seat, name: String(msg.name ?? '').slice(0, 12), token: String(msg.token ?? '') };
        broadcast(room, { t: 'lobby', lobby: lobbyRoster(room) }, null);
        return;
      }

      case 'state': {
        if (!room || !joined) return;
        room.touched = Date.now();
        room.snapshot = msg.snapshot;
        room.started = true; // a snapshot only exists once the host started the game
        broadcast(room, { t: 'state', snapshot: msg.snapshot }, ws);
        return;
      }

      case 'ping':
        return send(ws, { t: 'pong' });
    }
  });

  ws.on('close', () => {
    if (!joined) return;
    const room = rooms.get(joined.code);
    if (!room) return;
    room.sockets.delete(ws);
    room.touched = Date.now();
    if (!room.started) {
      delete room.lobby[joined.seat]; // free the seat for the next joiner
      broadcast(room, { t: 'lobby', lobby: lobbyRoster(room) }, null);
    }
  });
});

// Heartbeat: drop dead sockets so seats free up for rejoin.
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) {
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    ws.ping();
  }
}, 30_000).unref();

server.listen(PORT, () => console.log(`atl-monopoly serving on :${PORT}`));
