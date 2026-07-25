/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { ArrowDownIcon, ArrowUpIcon, XMarkIcon } from '@heroicons/react/24/solid';
import type { Player, Property, PropertyGroup } from '../types';
import {
  canBuildHouse,
  canMortgage,
  canSellHouse,
  GROUP_LABELS,
  mortgageValue,
  sellHousePrice,
  unmortgageCost,
} from '../game/engine';

const GROUP_BG: Record<string, string> = {
  PURPLE: 'bg-purple-700',
  LIGHT_BLUE: 'bg-sky-500',
  PINK: 'bg-pink-500',
  ORANGE: 'bg-orange-500',
  RED: 'bg-red-600',
  YELLOW: 'bg-yellow-500',
  GREEN: 'bg-green-600',
  DARK_BLUE: 'bg-blue-700',
  RAILROAD: 'bg-zinc-500',
  UTILITY: 'bg-slate-500',
};

interface PropertyManagerProps {
  player: Player;
  properties: Property[];
  onClose: () => void;
  onBuildHouse: (propertyId: number) => void;
  onSellHouse: (propertyId: number) => void;
  onMortgage: (propertyId: number) => void;
  onUnmortgage: (propertyId: number) => void;
}

export const PropertyManager: React.FC<PropertyManagerProps> = ({
  player,
  properties,
  onClose,
  onBuildHouse,
  onSellHouse,
  onMortgage,
  onUnmortgage,
}) => {
  const owned = properties.filter((p) => p.owner === player.id);

  // Group by color
  const byGroup: Record<string, Property[]> = {};
  owned.forEach((p) => {
    if (!byGroup[p.group]) byGroup[p.group] = [];
    byGroup[p.group].push(p);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="bg-zinc-800 px-4 py-3 border-b border-zinc-700 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-white">Manage Properties</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {player.name} • <span className="text-green-400 font-mono">${player.money}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {owned.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              You don't own any properties yet. Land on something and cop it.
            </div>
          )}

          {Object.entries(byGroup).map(([group, props]) => {
            const groupKey = group as PropertyGroup;
            return (
              <div
                key={group}
                className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden"
              >
                <div className={`${GROUP_BG[group]} px-3 py-1.5 flex items-center justify-between`}>
                  <span className="text-xs font-black uppercase tracking-wider text-white drop-shadow">
                    {GROUP_LABELS[groupKey]}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-white/70">
                    {props.length} owned
                  </span>
                </div>

                <div className="divide-y divide-zinc-800">
                  {props.map((p) => {
                    const buildOk = canBuildHouse(properties, p, player.money);
                    const sellOk = canSellHouse(properties, p);
                    const mortgageOk = canMortgage(properties, p);
                    const unmortgageOk = p.mortgaged && player.money >= unmortgageCost(p);

                    return (
                      <div key={p.id} className="px-3 py-2 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-bold text-sm flex items-center space-x-2">
                            <span className={p.mortgaged ? 'text-red-400 line-through' : ''}>
                              {p.name}
                            </span>
                            {p.level > 0 && (
                              <span className="text-[10px] font-mono text-green-400 bg-green-950/40 px-1.5 rounded">
                                {p.level === 5 ? 'HOTEL' : `${p.level}×🏠`}
                              </span>
                            )}
                            {p.mortgaged && (
                              <span className="text-[10px] uppercase font-bold text-red-400">
                                Mortgaged
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            ${p.price} • rent ${p.rent[p.level] ?? 0}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          {/* House controls — only on color sets */}
                          {p.group !== 'RAILROAD' && p.group !== 'UTILITY' && (
                            <>
                              <button
                                disabled={!sellOk}
                                onClick={() => onSellHouse(p.id)}
                                title={`Sell house (+$${sellHousePrice(p)})`}
                                className="w-7 h-7 rounded bg-zinc-800 hover:bg-red-900/50 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center text-red-400 transition-colors"
                              >
                                <ArrowDownIcon className="w-3.5 h-3.5" />
                              </button>
                              <button
                                disabled={!buildOk}
                                onClick={() => onBuildHouse(p.id)}
                                title={`Build house (-$${p.upgradeCost})`}
                                className="w-7 h-7 rounded bg-zinc-800 hover:bg-green-900/50 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center text-green-400 transition-colors"
                              >
                                <ArrowUpIcon className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* Mortgage toggle */}
                          {p.mortgaged ? (
                            <button
                              disabled={!unmortgageOk}
                              onClick={() => onUnmortgage(p.id)}
                              className="ml-2 px-2 py-1 text-[10px] font-bold uppercase rounded bg-yellow-900/40 hover:bg-yellow-800/60 disabled:opacity-25 disabled:cursor-not-allowed text-yellow-300 transition-colors"
                              title={`Pay $${unmortgageCost(p)} to unmortgage`}
                            >
                              Unmortgage
                            </button>
                          ) : (
                            <button
                              disabled={!mortgageOk}
                              onClick={() => onMortgage(p.id)}
                              className="ml-2 px-2 py-1 text-[10px] font-bold uppercase rounded bg-zinc-800 hover:bg-yellow-900/40 disabled:opacity-25 disabled:cursor-not-allowed text-yellow-400 transition-colors"
                              title={`Mortgage for $${mortgageValue(p)}`}
                            >
                              Mortgage
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-zinc-800 px-4 py-3 border-t border-zinc-700 text-[11px] text-zinc-500 leading-snug">
          <p>
            <span className="text-zinc-300 font-bold">Even building:</span> houses must be added /
            sold across a color set evenly. Mortgaging a property is only allowed when its color
            set has no houses.
          </p>
        </div>
      </div>
    </div>
  );
};
