/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Thin WebSocket client for room-code multiplayer. The server is a dumb relay:
 * whoever acts publishes the full game snapshot, everyone else applies it.
 * Reconnects automatically and re-joins with the stored (code, seat) so a
 * refresh or a dropped connection lands back in the same game.
 */

export interface LobbyPlayer {
  seat: number;
  name: string;
  token: string;
}

export interface JoinedInfo {
  code: string;
  seat: number;
  lobby: LobbyPlayer[];
  started: boolean;
  snapshot: unknown | null;
}

type Handlers = {
  onJoined?: (info: JoinedInfo) => void;
  onLobby?: (lobby: LobbyPlayer[]) => void;
  onState?: (snapshot: unknown) => void;
  onError?: (error: string) => void;
  onConnectionChange?: (connected: boolean) => void;
};

const SESSION_KEY = 'atl-monopoly-room';

export function rememberRoom(code: string, seat: number) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ code, seat }));
  } catch {}
}

export function recallRoom(): { code: string; seat: number } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function forgetRoom() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}

export class NetClient {
  private ws: WebSocket | null = null;
  private handlers: Handlers;
  private intent: { t: 'create' } | { t: 'join'; code: string; seat?: number } | null = null;
  private closedByUs = false;
  private retryMs = 500;
  code: string | null = null;
  seat: number | null = null;

  constructor(handlers: Handlers) {
    this.handlers = handlers;
  }

  private wsUrl() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${location.host}/ws`;
  }

  private open() {
    this.ws = new WebSocket(this.wsUrl());
    this.ws.onopen = () => {
      this.retryMs = 500;
      this.handlers.onConnectionChange?.(true);
      if (this.code !== null && this.seat !== null) {
        // reconnect: reclaim our seat
        this.send({ t: 'join', code: this.code, seat: this.seat });
      } else if (this.intent) {
        this.send(this.intent);
      }
    };
    this.ws.onmessage = (ev) => {
      let msg: any;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      switch (msg.t) {
        case 'joined':
          this.code = msg.code;
          this.seat = msg.seat;
          rememberRoom(msg.code, msg.seat);
          this.handlers.onJoined?.(msg as JoinedInfo);
          break;
        case 'lobby':
          this.handlers.onLobby?.(msg.lobby ?? []);
          break;
        case 'state':
          this.handlers.onState?.(msg.snapshot);
          break;
        case 'error':
          this.handlers.onError?.(msg.error ?? 'Unknown error');
          break;
      }
    };
    this.ws.onclose = () => {
      this.handlers.onConnectionChange?.(false);
      if (this.closedByUs) return;
      setTimeout(() => this.open(), this.retryMs);
      this.retryMs = Math.min(this.retryMs * 2, 8000);
    };
    this.ws.onerror = () => this.ws?.close();
  }

  createRoom() {
    this.intent = { t: 'create' };
    this.open();
  }

  joinRoom(code: string, seat?: number) {
    this.intent = { t: 'join', code: code.toUpperCase(), seat };
    this.open();
  }

  sendLobby(name: string, token: string) {
    if (this.code === null) return;
    this.send({ t: 'lobby', code: this.code, name, token });
  }

  publish(snapshot: unknown, started = false) {
    if (this.code === null) return;
    this.send({ t: 'state', code: this.code, snapshot, started });
  }

  private send(msg: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }

  close() {
    this.closedByUs = true;
    forgetRoom();
    this.ws?.close();
  }
}
