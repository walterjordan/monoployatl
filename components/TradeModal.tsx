/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { ArrowsRightLeftIcon, XMarkIcon } from '@heroicons/react/24/solid';
import type { Player, Property } from '../types';

export interface TradeOffer {
  fromPlayerId: number;
  toPlayerId: number;
  /** Property ids the proposer is giving */
  giveProperties: number[];
  giveCash: number;
  /** Property ids the proposer wants */
  receiveProperties: number[];
  receiveCash: number;
}

interface TradeModalProps {
  fromPlayer: Player;
  candidatePlayers: Player[]; // non-bankrupt opponents
  properties: Property[];
  onClose: () => void;
  onPropose: (offer: TradeOffer) => void;
}

/**
 * Hotseat trade modal. Builder phase only — the accept/reject confirmation
 * is handled by a separate prompt rendered by App.tsx after onPropose fires.
 */
export const TradeModal: React.FC<TradeModalProps> = ({
  fromPlayer,
  candidatePlayers,
  properties,
  onClose,
  onPropose,
}) => {
  const [toPlayerId, setToPlayerId] = useState<number | null>(
    candidatePlayers[0]?.id ?? null,
  );
  const [give, setGive] = useState<Set<number>>(new Set());
  const [receive, setReceive] = useState<Set<number>>(new Set());
  const [giveCash, setGiveCash] = useState(0);
  const [receiveCash, setReceiveCash] = useState(0);

  const toPlayer = candidatePlayers.find((p) => p.id === toPlayerId) ?? null;
  const myProps = properties.filter((p) => p.owner === fromPlayer.id);
  const theirProps = toPlayer ? properties.filter((p) => p.owner === toPlayer.id) : [];

  // Don't let people trade a property that has houses on it (rules: must sell all houses first)
  const isTradable = (p: Property) => p.level === 0;

  const toggle = (set: Set<number>, id: number, update: (s: Set<number>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    update(next);
  };

  const giveCashValid = giveCash >= 0 && giveCash <= fromPlayer.money;
  const receiveCashValid =
    receiveCash >= 0 && (toPlayer ? receiveCash <= toPlayer.money : false);
  const hasSomething = give.size + receive.size + giveCash + receiveCash > 0;
  const valid = toPlayer && giveCashValid && receiveCashValid && hasSomething;

  const submit = () => {
    if (!valid || !toPlayer) return;
    onPropose({
      fromPlayerId: fromPlayer.id,
      toPlayerId: toPlayer.id,
      giveProperties: [...give],
      giveCash,
      receiveProperties: [...receive],
      receiveCash,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="bg-zinc-800 px-4 py-3 border-b border-zinc-700 flex justify-between items-center">
          <h3 className="font-bold text-white flex items-center space-x-2">
            <ArrowsRightLeftIcon className="w-5 h-5 text-blue-400" />
            <span>Propose Trade</span>
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Opponent picker */}
        <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-800 flex items-center space-x-3 text-sm">
          <span className="text-zinc-400">Trade with:</span>
          <div className="flex space-x-2">
            {candidatePlayers.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setToPlayerId(p.id);
                  setReceive(new Set());
                  setReceiveCash(0);
                }}
                className={`px-3 py-1 rounded font-bold text-sm transition-colors ${
                  toPlayerId === p.id
                    ? `${p.color} text-white`
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-zinc-800 flex-1 overflow-hidden">
          {/* Give side */}
          <div className="flex flex-col overflow-hidden">
            <div className="px-4 py-2 bg-blue-950/40 border-b border-zinc-800">
              <div className="text-xs uppercase font-black tracking-wider text-blue-300">
                {fromPlayer.name} gives
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-3 space-y-1">
              {myProps.length === 0 && (
                <p className="text-xs text-zinc-500 italic">No properties to offer.</p>
              )}
              {myProps.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-center space-x-2 px-2 py-1.5 rounded text-sm cursor-pointer transition-colors ${
                    give.has(p.id)
                      ? 'bg-blue-900/40 border border-blue-700'
                      : 'bg-zinc-800/60 border border-transparent hover:bg-zinc-800'
                  } ${!isTradable(p) ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    disabled={!isTradable(p)}
                    checked={give.has(p.id)}
                    onChange={() => isTradable(p) && toggle(give, p.id, setGive)}
                    className="accent-blue-500"
                  />
                  <span className="flex-1">{p.name}</span>
                  <span className="text-[10px] font-mono text-zinc-400">${p.price}</span>
                  {!isTradable(p) && (
                    <span className="text-[9px] text-red-400 uppercase">has houses</span>
                  )}
                </label>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-950/80">
              <label className="text-[11px] uppercase text-zinc-500 font-bold">Cash</label>
              <input
                type="number"
                value={giveCash}
                min={0}
                max={fromPlayer.money}
                onChange={(e) => setGiveCash(parseInt(e.target.value) || 0)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 mt-1 text-sm font-mono focus:outline-none focus:border-blue-500"
              />
              <div className="text-[10px] text-zinc-500 mt-0.5">
                Available: ${fromPlayer.money}
              </div>
            </div>
          </div>

          {/* Receive side */}
          <div className="flex flex-col overflow-hidden">
            <div className="px-4 py-2 bg-emerald-950/40 border-b border-zinc-800">
              <div className="text-xs uppercase font-black tracking-wider text-emerald-300">
                {toPlayer ? `${toPlayer.name} gives` : 'Pick a player'}
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-3 space-y-1">
              {!toPlayer && (
                <p className="text-xs text-zinc-500 italic">Pick an opponent above.</p>
              )}
              {toPlayer && theirProps.length === 0 && (
                <p className="text-xs text-zinc-500 italic">{toPlayer.name} owns nothing.</p>
              )}
              {theirProps.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-center space-x-2 px-2 py-1.5 rounded text-sm cursor-pointer transition-colors ${
                    receive.has(p.id)
                      ? 'bg-emerald-900/40 border border-emerald-700'
                      : 'bg-zinc-800/60 border border-transparent hover:bg-zinc-800'
                  } ${!isTradable(p) ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    disabled={!isTradable(p)}
                    checked={receive.has(p.id)}
                    onChange={() => isTradable(p) && toggle(receive, p.id, setReceive)}
                    className="accent-emerald-500"
                  />
                  <span className="flex-1">{p.name}</span>
                  <span className="text-[10px] font-mono text-zinc-400">${p.price}</span>
                  {!isTradable(p) && (
                    <span className="text-[9px] text-red-400 uppercase">has houses</span>
                  )}
                </label>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-950/80">
              <label className="text-[11px] uppercase text-zinc-500 font-bold">Cash</label>
              <input
                type="number"
                value={receiveCash}
                min={0}
                max={toPlayer?.money ?? 0}
                disabled={!toPlayer}
                onChange={(e) => setReceiveCash(parseInt(e.target.value) || 0)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 mt-1 text-sm font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              />
              <div className="text-[10px] text-zinc-500 mt-0.5">
                Available: ${toPlayer?.money ?? 0}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-800 px-4 py-3 border-t border-zinc-700 flex justify-between items-center">
          <div className="text-[11px] text-zinc-500 italic">
            Both players need to confirm on the next screen.
          </div>
          <button
            disabled={!valid}
            onClick={submit}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-bold text-sm shadow-lg hover:scale-[1.02] disabled:opacity-30 disabled:scale-100 transition-all"
          >
            Send Offer
          </button>
        </div>
      </div>
    </div>
  );
};

interface TradeReviewProps {
  offer: TradeOffer;
  fromPlayer: Player;
  toPlayer: Player;
  properties: Property[];
  onAccept: () => void;
  onReject: () => void;
}

/**
 * Confirmation screen shown to the recipient. In hotseat this becomes a
 * "hand the laptop over" moment — both players see the offer, recipient decides.
 */
export const TradeReview: React.FC<TradeReviewProps> = ({
  offer,
  fromPlayer,
  toPlayer,
  properties,
  onAccept,
  onReject,
}) => {
  const namesOf = (ids: number[]) =>
    ids.map((id) => properties.find((p) => p.id === id)?.name ?? '???');

  const giveNames = namesOf(offer.giveProperties);
  const receiveNames = namesOf(offer.receiveProperties);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-blue-700 to-purple-700 px-4 py-4 text-center">
          <div className="text-xs uppercase font-bold text-white/70 tracking-widest">
            Pass the laptop to
          </div>
          <div className="text-2xl font-black text-white mt-1">{toPlayer.name}</div>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-center text-sm text-zinc-400">
            {fromPlayer.name} is offering you a trade:
          </div>

          <div className="bg-blue-950/40 border border-blue-900 rounded-lg p-3">
            <div className="text-[10px] uppercase font-bold text-blue-300 mb-1">You receive</div>
            <div className="text-sm">
              {giveNames.length > 0 && (
                <div>
                  Properties: <span className="text-white">{giveNames.join(', ')}</span>
                </div>
              )}
              {offer.giveCash > 0 && (
                <div>
                  Cash: <span className="text-green-400 font-mono">${offer.giveCash}</span>
                </div>
              )}
              {giveNames.length === 0 && offer.giveCash === 0 && (
                <span className="italic text-zinc-500">Nothing</span>
              )}
            </div>
          </div>

          <div className="bg-emerald-950/40 border border-emerald-900 rounded-lg p-3">
            <div className="text-[10px] uppercase font-bold text-emerald-300 mb-1">You give</div>
            <div className="text-sm">
              {receiveNames.length > 0 && (
                <div>
                  Properties: <span className="text-white">{receiveNames.join(', ')}</span>
                </div>
              )}
              {offer.receiveCash > 0 && (
                <div>
                  Cash: <span className="text-green-400 font-mono">${offer.receiveCash}</span>
                </div>
              )}
              {receiveNames.length === 0 && offer.receiveCash === 0 && (
                <span className="italic text-zinc-500">Nothing</span>
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              onClick={onReject}
              className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 rounded font-bold text-sm"
            >
              Reject
            </button>
            <button
              onClick={onAccept}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded font-bold text-sm shadow-lg hover:scale-[1.02] transition-all"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
