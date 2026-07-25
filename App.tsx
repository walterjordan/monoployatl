/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { getGameCommentary } from './services/gemini';
import {
  BuildingOfficeIcon,
  UserIcon,
  TrophyIcon,
  ChatBubbleBottomCenterTextIcon,
  UserPlusIcon,
  PlayIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  PhotoIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowsRightLeftIcon,
  HomeModernIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';
import type { Card, Debt, DebtEntry, GamePhase, Player, Property, Tile } from './types';
import {
  BOARD_TILES,
  GO_BONUS,
  JAIL_POSITION,
  JAIL_BAIL,
  PLAYER_COLORS,
  PROPERTIES,
  STARTING_MONEY,
  TOKENS,
} from './game/data';
import {
  calculateRent,
  didPassGo,
  drawFromDeck,
  freshDecks,
  mortgageValue,
  rollDice,
  sellHousePrice,
  unmortgageCost,
} from './game/engine';
import { PropertyManager } from './components/PropertyManager';
import { TradeModal, TradeReview, type TradeOffer } from './components/TradeModal';

// --- Reusable Components ---

const GamePiece = ({ name, className = 'w-full h-full' }: { name: string; className?: string }) => {
  const commonProps = {
    className,
    fill: 'currentColor',
    viewBox: '0 0 24 24',
  };

  switch (name) {
    case 'Box Chevy':
      return (
        <svg {...commonProps}>
          <path d="M3 10h18v6h-2v2h-2v-2H7v2H5v-2H3v-6zm2-4l2-2h10l2 2v2H5V6z" />
          <circle cx="6" cy="14" r="1.5" fill="transparent" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="18" cy="14" r="1.5" fill="transparent" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'Hashbrowns':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path
            d="M8 12h8M12 8v8M9 10l6 4M15 10l-6 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'Trap Phone':
      return (
        <svg {...commonProps}>
          <rect x="7" y="2" width="10" height="20" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <rect x="9" y="4" width="6" height="6" fill="currentColor" opacity="0.5" />
          <path
            d="M9 14h2v2H9v-2zm4 0h2v2h-2v-2zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2z"
            fill="currentColor"
          />
          <path d="M12 2v-2" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'Double Cup':
      return (
        <svg {...commonProps}>
          <path d="M7 4l2 16h6l2-16H7z" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M6 7l2 14h8l2-14H6z" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M8 4c0 0 2 4 2 6s2-6 4-2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'Wing Basket':
      return (
        <svg {...commonProps}>
          <path
            d="M6 14c0-4 3-8 3-8s4 2 6 5c2 3 0 6-3 7s-6-4-6-4z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <line x1="9" y1="14" x2="7" y2="18" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M2 18h20l-2 4H4l-2-4z"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            opacity="0.5"
          />
        </svg>
      );
    case 'Shopping Bag':
      return (
        <svg {...commonProps}>
          <path d="M6 8h12v12H6z" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path
            d="M9 8V5c0-1.5 1.5-2 3-2s3 .5 3 2v3"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path d="M12 11v2" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'EBT Card':
      return (
        <svg {...commonProps}>
          <rect x="2" y="6" width="20" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <rect x="4" y="9" width="3" height="3" fill="currentColor" opacity="0.5" />
          <line x1="2" y1="14" x2="22" y2="14" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        </svg>
      );
    default:
      return <UserIcon className={className} />;
  }
};

const MoneyBill = () => (
  <svg
    viewBox="0 0 300 140"
    className="w-24 md:w-32 h-auto drop-shadow-md transform rotate-1 hover:rotate-0 transition-transform origin-center ml-auto mr-4 cursor-pointer"
  >
    <defs>
      <pattern id="guilloche" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M0 10 Q 5 0, 10 10 T 20 10" fill="none" stroke="#166534" strokeWidth="0.5" opacity="0.2" />
      </pattern>
    </defs>
    <rect x="2" y="2" width="296" height="136" rx="8" fill="#dcfce7" stroke="#14532d" strokeWidth="2" />
    <rect x="12" y="12" width="276" height="116" rx="4" fill="url(#guilloche)" stroke="#15803d" strokeWidth="2" />
    <text x="25" y="45" fontFamily="monospace" fontWeight="bold" fontSize="32" fill="#14532d">$1.5k</text>
    <text x="275" y="125" fontFamily="monospace" fontWeight="bold" fontSize="32" fill="#14532d" textAnchor="end">$1.5k</text>
    <text x="25" y="125" fontFamily="monospace" fontWeight="bold" fontSize="32" fill="#14532d">$1.5k</text>
    <text x="275" y="45" fontFamily="monospace" fontWeight="bold" fontSize="32" fill="#14532d" textAnchor="end">$1.5k</text>
    <ellipse cx="150" cy="70" rx="55" ry="50" fill="#f0fdf4" stroke="#14532d" strokeWidth="2" />
    <text x="150" y="75" fontSize="60" textAnchor="middle" dominantBaseline="middle">⛄️</text>
    <text x="150" y="25" fontSize="14" fontWeight="bold" textAnchor="middle" fill="#14532d" letterSpacing="1" fontFamily="sans-serif">
      UNITED HOODS OF ATL
    </text>
    <text x="150" y="115" fontSize="10" fontWeight="bold" textAnchor="middle" fill="#15803d" fontFamily="monospace">
      IN TRAP WE TRUST
    </text>
    <text x="220" y="90" fontSize="8" fontFamily="monospace" fill="#dc2626" transform="rotate(-10 220,90)">
      A-T-L-4-0-4
    </text>
  </svg>
);

const SetupScreen = ({
  onStart,
  onResume,
}: {
  onStart: (players: Player[]) => void;
  onResume: (() => void) | null;
}) => {
  const [roster, setRoster] = useState<Player[]>([]);
  const [name, setName] = useState('');
  const [selectedTokenIdx, setSelectedTokenIdx] = useState<number | null>(null);

  const takenTokens = roster.map((p) => p.token);

  const handleAdd = () => {
    if (!name || selectedTokenIdx === null) return;
    const token = TOKENS[selectedTokenIdx];
    const newPlayer: Player = {
      id: roster.length,
      name,
      token: token.name,
      money: STARTING_MONEY,
      position: 0,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      bankrupt: false,
      color: PLAYER_COLORS[roster.length % PLAYER_COLORS.length],
    };
    setRoster([...roster, newPlayer]);
    setName('');
    setSelectedTokenIdx(null);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl md:text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-8 tracking-tighter text-center px-4 py-2 leading-tight">
        WHO PLAYIN'?
      </h1>

      {onResume && (
        <button
          onClick={onResume}
          className="mb-8 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl font-black text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center space-x-2"
        >
          <ArrowPathIcon className="w-5 h-5" />
          <span>RESUME SAVED GAME</span>
        </button>
      )}

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-zinc-900/80 p-6 rounded-xl border border-zinc-800 backdrop-blur-md shadow-2xl">
          <h2 className="text-xl font-bold mb-4 flex items-center text-blue-400">
            <UserPlusIcon className="w-5 h-5 mr-2" /> New Player
          </h2>

          <div className="mb-4">
            <label className="text-xs text-zinc-500 uppercase font-bold">Street Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name..."
              className="w-full bg-zinc-800 border border-zinc-700 text-white p-3 rounded-lg focus:outline-none focus:border-blue-500 mt-1 placeholder-zinc-600 font-mono"
              maxLength={12}
            />
          </div>

          <div className="mb-6">
            <label className="text-xs text-zinc-500 uppercase font-bold mb-2 block">Choose Your Piece</label>
            <div className="grid grid-cols-4 gap-2">
              {TOKENS.map((t, i) => {
                const isTaken = takenTokens.includes(t.name);
                const isSelected = selectedTokenIdx === i;
                return (
                  <button
                    key={i}
                    disabled={isTaken}
                    onClick={() => setSelectedTokenIdx(i)}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center border transition-all relative group p-2
                       ${
                         isTaken
                           ? 'bg-zinc-900 border-zinc-800 opacity-30 cursor-not-allowed'
                           : isSelected
                           ? 'bg-blue-900/30 border-blue-500 ring-2 ring-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                           : 'bg-zinc-800 border-zinc-700 hover:border-zinc-500 hover:bg-zinc-700'
                       }
                    `}
                  >
                    <GamePiece
                      name={t.name}
                      className={`w-8 h-8 ${isSelected ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedTokenIdx !== null && (
              <div className="mt-3 p-2 bg-blue-900/20 border border-blue-900/50 rounded text-center">
                <p className="text-sm font-bold text-blue-400">{TOKENS[selectedTokenIdx].name}</p>
                <p className="text-xs text-zinc-400 italic">"{TOKENS[selectedTokenIdx].description}"</p>
              </div>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={!name || selectedTokenIdx === null || roster.length >= 6}
            className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors uppercase tracking-wide flex items-center justify-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add to Squad</span>
          </button>
        </div>

        <div className="flex flex-col h-full justify-between">
          <div className="flex-1 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 mb-4 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-zinc-400 flex items-center justify-between">
              <span>Current Squad</span>
              <span className="text-xs bg-zinc-800 px-2 py-1 rounded-full text-zinc-500">{roster.length}/6</span>
            </h2>

            {roster.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-zinc-700 border-2 border-dashed border-zinc-800 rounded-lg">
                <UserIcon className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm">No players yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {roster.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg border border-zinc-700 animate-in fade-in slide-in-from-left-4 duration-300"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center bg-black/50 ${p.color.replace(
                          'bg-',
                          'border-2 border-',
                        )} p-2`}
                      >
                        <GamePiece name={p.token} className="w-full h-full text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-lg leading-none mb-1">{p.name}</div>
                        <div className="text-xs text-zinc-500 font-mono flex items-center space-x-2">
                          <span className="text-green-500 font-bold">${STARTING_MONEY}</span>
                          <span className="text-zinc-600">•</span>
                          <span className="text-zinc-400">Ready</span>
                        </div>
                      </div>
                    </div>

                    <MoneyBill />

                    <button
                      onClick={() => setRoster(roster.filter((r) => r.id !== p.id))}
                      className="p-2 hover:bg-red-900/30 text-zinc-600 hover:text-red-500 rounded-lg transition-colors ml-2"
                      title="Remove Player"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onStart(roster)}
            disabled={roster.length < 2}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-black text-xl shadow-lg shadow-purple-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center space-x-2"
          >
            <span>START GAME</span>
            <PlayIcon className="w-6 h-6" />
          </button>
          {roster.length < 2 && (
            <p className="text-center text-xs text-zinc-600 mt-2">Need at least 2 players to start.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const DeedView = ({ property, onClose }: { property: Property; onClose: () => void }) => {
  const groupColors: Record<string, string> = {
    PURPLE: 'bg-purple-600',
    LIGHT_BLUE: 'bg-sky-500',
    PINK: 'bg-pink-500',
    ORANGE: 'bg-orange-500',
    RED: 'bg-red-600',
    YELLOW: 'bg-yellow-400 text-black',
    GREEN: 'bg-green-600',
    DARK_BLUE: 'bg-blue-700',
    RAILROAD: 'bg-zinc-200 text-black',
    UTILITY: 'bg-slate-300 text-black',
  };

  const headerColor = groupColors[property.group] || 'bg-zinc-700';
  const isDarkHeader = !headerColor.includes('text-black');

  return (
    <div className="flex flex-col md:flex-row bg-white text-black rounded-lg overflow-hidden shadow-2xl max-w-2xl w-full mx-4 animate-in zoom-in-95 duration-200">
      <div className="md:w-1/2 bg-zinc-100 relative">
        {property.image ? (
          <img src={property.image} alt={property.name} className="w-full h-full object-cover min-h-[200px]" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-200 min-h-[200px] text-zinc-400">
            <PhotoIcon className="w-16 h-16" />
          </div>
        )}
        {property.description && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-3 text-xs backdrop-blur-sm">
            {property.description}
          </div>
        )}
      </div>

      <div className="md:w-1/2 flex flex-col border-l border-zinc-200">
        <div className={`p-4 text-center border-b-2 border-black ${headerColor}`}>
          <div className="text-xs uppercase font-bold tracking-widest opacity-80 mb-1">Title Deed</div>
          <div
            className={`text-2xl font-black uppercase tracking-tight leading-none ${isDarkHeader ? 'text-white' : 'text-black'}`}
          >
            {property.name}
          </div>
        </div>

        <div className="p-4 flex-1 text-xs sm:text-sm font-mono space-y-2">
          {property.group === 'RAILROAD' ? (
            <>
              <div className="flex justify-between"><span>1 Railroad</span><span>${property.rent[0]}</span></div>
              <div className="flex justify-between"><span>2 Railroads</span><span>${property.rent[1]}</span></div>
              <div className="flex justify-between"><span>3 Railroads</span><span>${property.rent[2]}</span></div>
              <div className="flex justify-between"><span>4 Railroads</span><span>${property.rent[3]}</span></div>
            </>
          ) : property.group === 'UTILITY' ? (
            <div className="text-center py-6">
              <p>1 owned: <span className="font-bold">4× dice</span></p>
              <p>2 owned: <span className="font-bold">10× dice</span></p>
            </div>
          ) : (
            <>
              <div className="flex justify-between">
                <span>Rent</span>
                <span>${property.rent[0]}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Full Color Set</span>
                <span>${property.rent[0] * 2}</span>
              </div>
              <div className="flex justify-between"><span>1 House</span><span>${property.rent[1]}</span></div>
              <div className="flex justify-between"><span>2 Houses</span><span>${property.rent[2]}</span></div>
              <div className="flex justify-between"><span>3 Houses</span><span>${property.rent[3]}</span></div>
              <div className="flex justify-between"><span>4 Houses</span><span>${property.rent[4]}</span></div>
              <div className="flex justify-between font-bold mt-2 pt-2 border-t border-zinc-200">
                <span>With BIG LOTTO (Hotel)</span>
                <span>${property.rent[5]}</span>
              </div>
              <div className="flex justify-between text-zinc-500 mt-2">
                <span>House Cost</span>
                <span>${property.upgradeCost}</span>
              </div>
            </>
          )}

          <div className="mt-4 pt-2 border-t border-zinc-300 text-center text-zinc-500 text-[10px] uppercase">
            Mortgage Value ${property.price / 2}
            {property.mortgaged && <span className="ml-2 text-red-500 font-bold">(MORTGAGED)</span>}
          </div>
        </div>

        <button
          onClick={onClose}
          className="bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold py-3 uppercase text-xs tracking-wider border-t border-zinc-200 transition-colors"
        >
          Close Deed
        </button>
      </div>
    </div>
  );
};

const TileView = ({
  tile,
  players,
  properties,
  onClick,
}: {
  tile: Tile;
  players: Player[];
  properties: Property[];
  onClick: () => void;
}) => {
  const property = tile.propertyId !== undefined ? properties.find((p) => p.id === tile.propertyId) : null;
  const groupColors: Record<string, string> = {
    PURPLE: 'bg-purple-900 border-purple-500',
    LIGHT_BLUE: 'bg-sky-900 border-sky-500',
    PINK: 'bg-pink-900 border-pink-500',
    ORANGE: 'bg-orange-900 border-orange-500',
    RED: 'bg-red-900 border-red-500',
    YELLOW: 'bg-yellow-900 border-yellow-500',
    GREEN: 'bg-green-900 border-green-500',
    DARK_BLUE: 'bg-blue-900 border-blue-500',
    RAILROAD: 'bg-zinc-800 border-zinc-500',
    UTILITY: 'bg-slate-800 border-slate-500',
  };

  const colorClass = property ? groupColors[property.group] : 'bg-zinc-900 border-zinc-800';
  const playersHere = players.filter((p) => p.position === tile.id && !p.bankrupt);

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col items-center justify-between p-1 border ${colorClass} ${
        playersHere.length > 0 ? 'ring-2 ring-white z-10' : 'opacity-90'
      } h-full w-full min-h-[60px] rounded-sm text-[9px] sm:text-[10px] select-none cursor-pointer hover:brightness-110 hover:scale-[1.02] transition-all`}
    >
      {property && (
        <div
          className={`w-full h-2 sm:h-3 mb-1 rounded-sm opacity-80 ${colorClass.replace('bg-', 'bg-opacity-100 bg-').split(' ')[0]}`}
        ></div>
      )}

      <div className="text-center font-bold leading-tight px-0.5 truncate w-full">{tile.name}</div>

      {property && <div className="text-zinc-400 font-mono">${property.price}</div>}

      {/* Houses / Hotel indicator */}
      {property && property.level > 0 && (
        <div className="flex space-x-0.5 absolute top-0.5 left-0.5">
          {property.level === 5 ? (
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-sm" title="Hotel" />
          ) : (
            Array.from({ length: property.level }).map((_, i) => (
              <div key={i} className="w-1 h-1.5 sm:w-1.5 sm:h-2 bg-green-400 rounded-sm" />
            ))
          )}
        </div>
      )}

      {/* Mortgage marker */}
      {property?.mortgaged && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
          <span className="text-[8px] sm:text-[9px] font-bold text-red-400 uppercase tracking-wider rotate-[-12deg]">
            Mortgaged
          </span>
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex -space-x-1">
          {playersHere.map((p) => (
            <div
              key={p.id}
              className="w-6 h-6 sm:w-8 sm:h-8 bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-white/20 p-1"
              title={p.name}
            >
              <GamePiece name={p.token} className={`w-full h-full ${p.color.replace('bg-', 'text-')}`} />
            </div>
          ))}
        </div>
      </div>

      {property && property.owner !== null && (
        <div
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-tl sm:w-4 sm:h-4 ${
            players.find((pl) => pl.id === property.owner)?.color ?? 'bg-zinc-500'
          } border-t border-l border-black`}
        ></div>
      )}
    </div>
  );
};

const Modal = ({
  isOpen,
  title,
  children,
  onClose,
}: {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-zinc-800 px-4 py-3 border-b border-zinc-700 flex justify-between items-center">
          <h3 className="font-bold text-white">{title}</h3>
          {onClose && (
            <button onClick={onClose} className="text-zinc-400 hover:text-white">
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// --- Main App ---

/** localStorage key for the mid-game snapshot. Bump the suffix on breaking shape changes. */
const SAVE_KEY = 'atl-monopoly-save-v1';

interface SavedGame {
  players: Player[];
  properties: Property[];
  currentPlayerIndex: number;
  gameLog: string[];
  dice: [number, number];
  doublesCount: number;
  extraTurn: boolean;
  phase: 'idle' | 'turnEnd';
  decks: { CHANCE: Card[]; COMMUNITY: Card[] };
}

function readSavedGame(): SavedGame | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedGame;
    if (!Array.isArray(parsed.players) || parsed.players.length < 2) return null;
    return parsed;
  } catch {
    return null;
  }
}

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [properties, setProperties] = useState<Property[]>(PROPERTIES);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [commentary, setCommentary] = useState('');
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [decks, setDecks] = useState<{ CHANCE: Card[]; COMMUNITY: Card[] }>(freshDecks);

  // Turn flow
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [doublesCount, setDoublesCount] = useState(0); // 3 doubles = jail
  const [extraTurn, setExtraTurn] = useState(false); // set after non-jail doubles
  const [winner, setWinner] = useState<Player | null>(null);
  const [debt, setDebt] = useState<Debt | null>(null);

  // Modal payloads
  const [pendingPropertyId, setPendingPropertyId] = useState<number | null>(null);
  const [pendingCard, setPendingCard] = useState<{ card: Card; deck: 'CHANCE' | 'COMMUNITY' } | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);

  // Side-panel modals (accessible during idle and debt phases)
  const [showPropertyManager, setShowPropertyManager] = useState(false);
  const [showTradeBuilder, setShowTradeBuilder] = useState(false);
  const [pendingOffer, setPendingOffer] = useState<TradeOffer | null>(null);

  const [savedGame, setSavedGame] = useState<SavedGame | null>(readSavedGame);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Snapshot the game at stable phases so a refresh doesn't kill an hour-long game.
  useEffect(() => {
    if (!gameStarted || winner) return;
    if (phase !== 'idle' && phase !== 'turnEnd') return;
    const snapshot: SavedGame = {
      players,
      properties,
      currentPlayerIndex,
      gameLog: gameLog.slice(-60),
      dice,
      doublesCount,
      extraTurn,
      phase,
      decks,
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
    } catch {
      // Storage full/blocked: play on without persistence.
    }
  }, [gameStarted, winner, phase, players, properties, currentPlayerIndex, gameLog, dice, doublesCount, extraTurn, decks]);

  useEffect(() => {
    if (winner) {
      try {
        localStorage.removeItem(SAVE_KEY);
      } catch {}
    }
  }, [winner]);

  const resumeSavedGame = () => {
    if (!savedGame) return;
    setPlayers(savedGame.players);
    // Only dynamic fields come from the save; static data (images, rents, names)
    // always comes from current code so saves survive content updates.
    setProperties(
      PROPERTIES.map((base) => {
        const saved = savedGame.properties.find((p) => p.id === base.id);
        return saved
          ? { ...base, owner: saved.owner, level: saved.level, mortgaged: saved.mortgaged }
          : { ...base };
      }),
    );
    setCurrentPlayerIndex(savedGame.currentPlayerIndex);
    setGameLog([...savedGame.gameLog, 'Game resumed from save.']);
    setDice(savedGame.dice);
    setDoublesCount(savedGame.doublesCount);
    setExtraTurn(savedGame.extraTurn);
    setDecks(savedGame.decks);
    setPhase(savedGame.phase);
    setGameStarted(true);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gameLog]);

  useEffect(() => {
    if (gameStarted) {
      triggerAI('Game Start', 'The game has started. Players are on the board.');
    }
  }, [gameStarted]);

  const addLog = (msg: string) => setGameLog((prev) => [...prev, msg]);

  const triggerAI = async (event: string, details: string) => {
    const comment = await getGameCommentary(event, details);
    setCommentary(comment);
  };

  // ---------------------------------------------------------------------------
  // Turn flow
  // ---------------------------------------------------------------------------

  const handleRoll = () => {
    if (phase !== 'idle' || winner) return;
    setPhase('rolling');
    setCommentary('');

    // Dice animation
    let rolls = 0;
    const animInterval = setInterval(() => {
      setDice([Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)]);
      rolls++;
      if (rolls > 10) {
        clearInterval(animInterval);
        const [d1, d2] = rollDice();
        setDice([d1, d2]);
        // Brief pause so players see the final dice before the token moves
        setTimeout(() => resolveRoll(d1, d2), 400);
      }
    }, 80);
  };

  const resolveRoll = (d1: number, d2: number) => {
    const player = players[currentPlayerIndex];
    if (!player) return;
    const total = d1 + d2;
    const isDoubles = d1 === d2;

    // --- Jail handling ---
    if (player.inJail) {
      if (isDoubles) {
        addLog(`${player.name} rolled doubles (${d1}+${d2}) and walked out of Fulton County.`);
        updatePlayer(player.id, { inJail: false, jailTurns: 0 });
        triggerAI('Jail Break', `${player.name} got out on doubles.`);
        movePlayer(player, total, /* extraTurnEligible */ false);
        return;
      }
      // Not doubles
      const newJailTurns = player.jailTurns + 1;
      if (newJailTurns >= 3) {
        // Forced to pay bail (or use card if they have one)
        if (player.getOutOfJailCards > 0) {
          addLog(`${player.name} used a Get Out of Jail card.`);
          updatePlayer(player.id, {
            inJail: false,
            jailTurns: 0,
            getOutOfJailCards: player.getOutOfJailCards - 1,
          });
          movePlayer({ ...player, inJail: false }, total, false);
        } else {
          addLog(`${player.name} sat 3 turns. Forced to pay $${JAIL_BAIL} bail.`);
          updatePlayer(player.id, { inJail: false, jailTurns: 0 });
          const paid = chargePlayer(
            { ...player, inJail: false, jailTurns: 0 },
            [{ creditorId: null, amount: JAIL_BAIL }],
            `Bail after 3 turns in Fulton County`,
            total,
          );
          if (paid) {
            movePlayer({ ...player, inJail: false, money: player.money - JAIL_BAIL }, total, false);
          }
        }
      } else {
        addLog(`${player.name} stuck in jail (turn ${newJailTurns}/3).`);
        updatePlayer(player.id, { jailTurns: newJailTurns });
        triggerAI('Stuck in Jail', `${player.name} couldn't roll out.`);
        setPhase('turnEnd');
      }
      return;
    }

    // --- Not in jail ---
    if (isDoubles) {
      const newDoublesCount = doublesCount + 1;
      if (newDoublesCount >= 3) {
        addLog(`${player.name} rolled 3 doubles in a row — straight to jail!`);
        updatePlayer(player.id, { position: JAIL_POSITION, inJail: true, jailTurns: 0 });
        setDoublesCount(0);
        setExtraTurn(false);
        triggerAI('Speed Trap', `${player.name} rolled too clean, got locked up.`);
        setPhase('turnEnd');
        return;
      }
      setDoublesCount(newDoublesCount);
      setExtraTurn(true);
      addLog(`${player.name} rolled doubles (${d1}+${d2}). Another turn!`);
    } else {
      setDoublesCount(0);
      setExtraTurn(false);
    }

    movePlayer(player, total, isDoubles);
  };

  /**
   * Move a player `steps` spaces forward, paying GO bonus if applicable,
   * then resolve landing on the destination tile.
   */
  const movePlayer = (player: Player, steps: number, _isDoubles: boolean) => {
    const newPos = (player.position + steps) % 40;
    const passedGo = didPassGo(player.position, newPos);

    if (passedGo) {
      addLog(`${player.name} passed GO. Collect $${GO_BONUS}.`);
      updatePlayer(player.id, { money: player.money + GO_BONUS, position: newPos });
    } else {
      updatePlayer(player.id, { position: newPos });
    }

    setPhase('moving');
    // Visual pause then resolve
    setTimeout(() => {
      resolveLanding(
        player.id,
        newPos,
        steps,
        passedGo ? player.money + GO_BONUS : player.money,
      );
    }, 600);
  };

  /**
   * Resolve the effect of landing on tile `pos`.
   * `playerCashAfterMove` reflects money after any GO bonus was applied.
   * Always advances to 'turnEnd' (or 'buying' / 'cardDraw' / 'gameOver') when done.
   */
  const resolveLanding = (
    playerId: number,
    pos: number,
    diceTotal: number,
    playerCashAfterMove: number,
  ) => {
    setPhase('landed');
    const tile = BOARD_TILES[pos];
    // Read latest player from state via functional setter snapshot is tricky inside
    // a normal call; use the closure player merged with the post-move cash.
    setPlayers((prevPlayers) => {
      const player = prevPlayers.find((p) => p.id === playerId)!;
      const freshPlayer: Player = { ...player, position: pos, money: playerCashAfterMove };

      // Use setTimeout(0) tricks would be racy; instead, schedule the resolution
      // outside the setter using the fresh data we already have.
      queueMicrotask(() => doResolveLanding(freshPlayer, tile, diceTotal));
      return prevPlayers;
    });
  };

  const doResolveLanding = (player: Player, tile: Tile, diceTotal: number) => {
    addLog(`${player.name} landed on ${tile.name}.`);

    switch (tile.type) {
      case 'GO_TO_JAIL':
        addLog(`${player.name} got locked up!`);
        updatePlayer(player.id, { position: JAIL_POSITION, inJail: true, jailTurns: 0 });
        setDoublesCount(0);
        setExtraTurn(false);
        triggerAI('Go to Jail', `${player.name} sent to Fulton County.`);
        setPhase('turnEnd');
        return;

      case 'TAX': {
        const tax = tile.taxAmount ?? 100;
        if (chargePlayer(player, [{ creditorId: null, amount: tax }], `${tile.name}`)) {
          addLog(`${player.name} paid $${tax} ${tile.name}.`);
          triggerAI('Tax', `${player.name} got taxed $${tax}.`);
          setPhase('turnEnd');
        }
        return;
      }

      case 'CHANCE':
      case 'COMMUNITY': {
        const deckType = tile.type;
        const { card, deck: nextDeck } = drawFromDeck(decks[deckType], deckType);
        setDecks((prev) => ({ ...prev, [deckType]: nextDeck }));
        addLog(`Card: ${card.text}`);
        setPendingCard({ card, deck: deckType });
        setPhase('cardDraw');
        triggerAI('Card Draw', card.text);
        return;
      }

      case 'PROPERTY': {
        const property = properties.find((p) => p.id === tile.propertyId)!;
        if (property.owner === null) {
          if (player.money >= property.price) {
            setPendingPropertyId(property.id);
            setPhase('buying');
            return;
          }
          addLog(`${player.name} too broke to buy ${property.name}.`);
          triggerAI('Too Broke', `${player.name} couldn't afford ${property.name}.`);
          setPhase('turnEnd');
          return;
        }
        if (property.owner === player.id) {
          addLog(`${player.name} owns this spot.`);
          setPhase('turnEnd');
          return;
        }
        // Pay rent (unless mortgaged)
        if (property.mortgaged) {
          addLog(`${property.name} is mortgaged — no rent owed.`);
          setPhase('turnEnd');
          return;
        }
        const owner = players.find((p) => p.id === property.owner)!;
        const rent = calculateRent(property, properties, diceTotal);
        if (rent === 0) {
          setPhase('turnEnd');
          return;
        }
        if (chargePlayer(player, [{ creditorId: owner.id, amount: rent }], `Rent on ${property.name} (owed to ${owner.name})`)) {
          addLog(`${player.name} pays $${rent} rent to ${owner.name}.`);
          triggerAI('Pay Rent', `${player.name} paid ${owner.name} $${rent}.`);
          setPhase('turnEnd');
        }
        return;
      }

      case 'GO':
      case 'JAIL':
      case 'FREE_PARKING':
      default:
        setPhase('turnEnd');
        return;
    }
  };

  // ---------------------------------------------------------------------------
  // State mutation helpers (functional setters to avoid stale closures)
  // ---------------------------------------------------------------------------

  const updatePlayer = (id: number, updates: Partial<Player>) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const applyMoneyChange = (id: number, delta: number) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, money: p.money + delta } : p)));
  };

  /**
   * Route ALL payments through here. `player` must reflect the payer's current cash
   * (callers thread post-move money through, so don't re-read stale state).
   * If cash covers the total, the transfer happens immediately and this returns true.
   * Otherwise we enter the 'debt' phase, where the player liquidates (sell houses,
   * mortgage) via the Property Manager until they can pay, or declares bankruptcy.
   * `postMoveSteps`: forward movement to resume after the debt clears (forced bail).
   */
  const chargePlayer = (
    player: Player,
    entries: DebtEntry[],
    reason: string,
    postMoveSteps?: number,
  ): boolean => {
    const total = entries.reduce((sum, e) => sum + e.amount, 0);
    if (player.money >= total) {
      applyMoneyChange(player.id, -total);
      entries.forEach((e) => {
        if (e.creditorId !== null) applyMoneyChange(e.creditorId, e.amount);
      });
      return true;
    }
    addLog(`${player.name} owes $${total} but only has $${player.money}. Time to liquidate.`);
    setDebt({ debtorId: player.id, entries, reason, postMoveSteps });
    setPhase('debt');
    triggerAI('Down Bad', `${player.name} owes $${total} and can't cover it.`);
    return false;
  };

  /** Pay off the outstanding debt (button enabled only when cash covers it). */
  const payDebt = () => {
    if (!debt) return;
    const debtor = players.find((p) => p.id === debt.debtorId);
    if (!debtor) return;
    const total = debt.entries.reduce((sum, e) => sum + e.amount, 0);
    if (debtor.money < total) return;

    applyMoneyChange(debtor.id, -total);
    debt.entries.forEach((e) => {
      if (e.creditorId !== null) applyMoneyChange(e.creditorId, e.amount);
    });
    addLog(`${debtor.name} paid off the $${total} debt.`);
    triggerAI('Debt Paid', `${debtor.name} scraped together $${total} and paid up.`);

    const postMoveSteps = debt.postMoveSteps;
    setDebt(null);
    if (postMoveSteps) {
      movePlayer({ ...debtor, money: debtor.money - total }, postMoveSteps, false);
    } else {
      setPhase('turnEnd');
    }
  };

  /** Give up: remaining cash and all properties go to the creditor (or the bank). */
  const declareBankruptcy = () => {
    if (!debt) return;
    const debtor = players.find((p) => p.id === debt.debtorId);
    if (!debtor) return;
    // If the debt is owed to exactly one player, they inherit everything; otherwise the bank.
    const creditorIds = [...new Set(debt.entries.map((e) => e.creditorId))].filter(
      (id): id is number => id !== null,
    );
    const creditorId = creditorIds.length === 1 ? creditorIds[0] : null;
    if (creditorId !== null && debtor.money > 0) {
      applyMoneyChange(creditorId, debtor.money);
    }
    setDebt(null);
    setShowPropertyManager(false);
    handleBankruptcy(debtor.id, creditorId);
  };

  // ---------------------------------------------------------------------------
  // Jail decisions (pre-roll options while phase === 'idle' and player is in jail)
  // ---------------------------------------------------------------------------

  const payBailEarly = () => {
    const player = players[currentPlayerIndex];
    if (!player?.inJail || player.money < JAIL_BAIL) return;
    applyMoneyChange(player.id, -JAIL_BAIL);
    updatePlayer(player.id, { inJail: false, jailTurns: 0 });
    addLog(`${player.name} paid $${JAIL_BAIL} bail and walked out.`);
    triggerAI('Bail Paid', `${player.name} paid their way out of Fulton County.`);
  };

  const useJailCardEarly = () => {
    const player = players[currentPlayerIndex];
    if (!player?.inJail || player.getOutOfJailCards < 1) return;
    updatePlayer(player.id, {
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: player.getOutOfJailCards - 1,
    });
    addLog(`${player.name} used a Get Out of Jail card.`);
    triggerAI('Jail Break', `${player.name} played their get-out card.`);
  };

  /**
   * Bankruptcy: hand all properties to the creditor (or back to bank if creditor === null).
   * With 2 players, this also ends the game. With more, the bankrupt player is skipped.
   */
  const handleBankruptcy = (debtorId: number, creditorId: number | null) => {
    addLog(`${players.find((p) => p.id === debtorId)?.name ?? 'Player'} is BANKRUPT.`);
    triggerAI('Bankruptcy', `${players.find((p) => p.id === debtorId)?.name ?? 'A player'} is down bad and out the game.`);
    setDoublesCount(0);
    setExtraTurn(false);
    setProperties((prev) =>
      prev.map((p) =>
        p.owner === debtorId
          ? {
              ...p,
              owner: creditorId, // null means returned to bank
              level: creditorId === null ? 0 : p.level,
              // If returned to bank, also unmortgage and reset
              mortgaged: creditorId === null ? false : p.mortgaged,
            }
          : p,
      ),
    );
    setPlayers((prev) => {
      const next = prev.map((p) =>
        p.id === debtorId
          ? { ...p, bankrupt: true, money: 0, getOutOfJailCards: 0 }
          : p,
      );
      // Check for a single survivor
      const survivors = next.filter((p) => !p.bankrupt);
      if (survivors.length === 1) {
        setWinner(survivors[0]);
        setPhase('gameOver');
      } else {
        setPhase('turnEnd');
      }
      return next;
    });
  };

  // ---------------------------------------------------------------------------
  // Buy modal handlers
  // ---------------------------------------------------------------------------

  const buyProperty = () => {
    if (pendingPropertyId === null) return;
    const property = properties.find((p) => p.id === pendingPropertyId)!;
    const player = players[currentPlayerIndex];

    applyMoneyChange(player.id, -property.price);
    setProperties((prev) => prev.map((p) => (p.id === property.id ? { ...p, owner: player.id } : p)));
    addLog(`${player.name} bought ${property.name} for $${property.price}.`);
    triggerAI('Buy Property', `${player.name} bought ${property.name}.`);

    setPendingPropertyId(null);
    setPhase('turnEnd');
  };

  const passProperty = () => {
    const property = properties.find((p) => p.id === pendingPropertyId);
    if (property) addLog(`${players[currentPlayerIndex].name} passed on ${property.name}.`);
    setPendingPropertyId(null);
    setPhase('turnEnd');
  };

  // ---------------------------------------------------------------------------
  // Upgrade / mortgage handlers (PropertyManager)
  // ---------------------------------------------------------------------------

  const handleBuildHouse = (propertyId: number) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === propertyId ? { ...p, level: p.level + 1 } : p)),
    );
    const prop = properties.find((p) => p.id === propertyId);
    if (prop) {
      applyMoneyChange(players[currentPlayerIndex].id, -prop.upgradeCost);
      const newLevel = prop.level + 1;
      addLog(
        `${players[currentPlayerIndex].name} built ${newLevel === 5 ? 'a hotel' : `house #${newLevel}`} on ${prop.name}.`,
      );
    }
  };

  const handleSellHouse = (propertyId: number) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === propertyId ? { ...p, level: Math.max(0, p.level - 1) } : p)),
    );
    const prop = properties.find((p) => p.id === propertyId);
    if (prop) {
      applyMoneyChange(players[currentPlayerIndex].id, sellHousePrice(prop));
      addLog(
        `${players[currentPlayerIndex].name} sold a house on ${prop.name} for $${sellHousePrice(prop)}.`,
      );
    }
  };

  const handleMortgage = (propertyId: number) => {
    const prop = properties.find((p) => p.id === propertyId);
    if (!prop) return;
    setProperties((prev) =>
      prev.map((p) => (p.id === propertyId ? { ...p, mortgaged: true } : p)),
    );
    applyMoneyChange(players[currentPlayerIndex].id, mortgageValue(prop));
    addLog(
      `${players[currentPlayerIndex].name} mortgaged ${prop.name} for $${mortgageValue(prop)}.`,
    );
  };

  const handleUnmortgage = (propertyId: number) => {
    const prop = properties.find((p) => p.id === propertyId);
    if (!prop) return;
    setProperties((prev) =>
      prev.map((p) => (p.id === propertyId ? { ...p, mortgaged: false } : p)),
    );
    applyMoneyChange(players[currentPlayerIndex].id, -unmortgageCost(prop));
    addLog(
      `${players[currentPlayerIndex].name} unmortgaged ${prop.name} for $${unmortgageCost(prop)}.`,
    );
  };

  // ---------------------------------------------------------------------------
  // Trade handlers
  // ---------------------------------------------------------------------------

  const handleTradePropose = (offer: TradeOffer) => {
    setShowTradeBuilder(false);
    setPendingOffer(offer);
  };

  const handleTradeAccept = () => {
    if (!pendingOffer) return;
    const offer = pendingOffer;

    // Reassign properties
    setProperties((prev) =>
      prev.map((p) => {
        if (offer.giveProperties.includes(p.id)) return { ...p, owner: offer.toPlayerId };
        if (offer.receiveProperties.includes(p.id)) return { ...p, owner: offer.fromPlayerId };
        return p;
      }),
    );
    // Exchange cash
    const net = offer.receiveCash - offer.giveCash;
    applyMoneyChange(offer.fromPlayerId, net);
    applyMoneyChange(offer.toPlayerId, -net);

    const fromName = players.find((p) => p.id === offer.fromPlayerId)?.name ?? 'Player';
    const toName = players.find((p) => p.id === offer.toPlayerId)?.name ?? 'Player';
    addLog(`Trade accepted between ${fromName} and ${toName}.`);
    triggerAI('Trade', `${fromName} and ${toName} just made a deal.`);

    setPendingOffer(null);
  };

  const handleTradeReject = () => {
    if (!pendingOffer) return;
    const toName = players.find((p) => p.id === pendingOffer.toPlayerId)?.name ?? 'Player';
    addLog(`${toName} rejected the trade.`);
    setPendingOffer(null);
  };

  // ---------------------------------------------------------------------------
  // Card modal handler
  // ---------------------------------------------------------------------------

  const acknowledgeCard = () => {
    if (!pendingCard) return;
    const { card } = pendingCard;
    const player = players[currentPlayerIndex];
    setPendingCard(null);

    if (card.getOutOfJail) {
      updatePlayer(player.id, { getOutOfJailCards: player.getOutOfJailCards + 1 });
    }
    if (card.collectFromEach) {
      // Opponents chip in what they have. Small card amounts never force a
      // liquidation on someone else's turn; they just pay what's in pocket.
      const others = players.filter((p) => p.id !== player.id && !p.bankrupt);
      let collected = 0;
      others.forEach((o) => {
        const pays = Math.min(card.collectFromEach!, Math.max(0, o.money));
        if (pays < card.collectFromEach!) addLog(`${o.name} could only chip in $${pays}.`);
        applyMoneyChange(o.id, -pays);
        collected += pays;
      });
      applyMoneyChange(player.id, collected);
    }
    if (card.payEach) {
      const others = players.filter((p) => p.id !== player.id && !p.bankrupt);
      const entries = others.map((o) => ({ creditorId: o.id, amount: card.payEach! }));
      if (chargePlayer(player, entries, card.text)) {
        setPhase('turnEnd');
      }
      return;
    }
    if (card.amount && card.amount < 0) {
      if (chargePlayer(player, [{ creditorId: null, amount: -card.amount }], card.text)) {
        setPhase('turnEnd');
      }
      return;
    }
    if (card.amount && card.amount > 0) {
      applyMoneyChange(player.id, card.amount);
    }
    if (card.goToJail) {
      updatePlayer(player.id, { position: JAIL_POSITION, inJail: true, jailTurns: 0 });
      setDoublesCount(0);
      setExtraTurn(false);
      setPhase('turnEnd');
      return;
    }
    if (typeof card.moveId === 'number') {
      const fresh = players.find((p) => p.id === player.id)!;
      // Movement cards: pass-GO if we advance forward across position 0.
      // (No deck card combines moveId with a cash amount, so only GO applies here.)
      const newPos = card.moveId;
      const passedGo = newPos < fresh.position;
      const moneyDelta = passedGo ? GO_BONUS : 0;
      if (passedGo) addLog(`${fresh.name} passed GO. Collect $${GO_BONUS}.`);
      updatePlayer(player.id, {
        position: newPos,
        money: fresh.money + moneyDelta,
      });
      // Resolve the new tile in 600ms
      setPhase('moving');
      setTimeout(
        () =>
          resolveLanding(
            fresh.id,
            newPos,
            /* diceTotal */ dice[0] + dice[1],
            fresh.money + moneyDelta,
          ),
        600,
      );
      return;
    }
    setPhase('turnEnd');
  };

  // ---------------------------------------------------------------------------
  // End of turn
  // ---------------------------------------------------------------------------

  const passControl = () => {
    if (winner) return;
    if (extraTurn) {
      setExtraTurn(false);
      setPhase('idle');
      return;
    }
    setCurrentPlayerIndex((prev) => {
      // Skip bankrupt players
      let next = (prev + 1) % players.length;
      while (players[next]?.bankrupt && next !== prev) {
        next = (next + 1) % players.length;
      }
      return next;
    });
    setDoublesCount(0);
    setPhase('idle');
  };

  // ---------------------------------------------------------------------------
  // Board layout helpers + tile click
  // ---------------------------------------------------------------------------

  const handleTileClick = (tile: Tile) => {
    if (tile.type === 'PROPERTY' && tile.propertyId !== undefined) {
      setSelectedPropertyId(tile.propertyId);
    }
  };

  const getGridStyle = (index: number) => {
    let row = 1;
    let col = 1;
    if (index >= 0 && index <= 10) {
      row = 11;
      col = 11 - index;
    } else if (index >= 11 && index <= 20) {
      col = 1;
      row = 11 - (index - 10);
    } else if (index >= 21 && index <= 30) {
      row = 1;
      col = index - 20 + 1;
    } else {
      col = 11;
      row = index - 30 + 1;
    }
    return { gridRow: row, gridColumn: col };
  };

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  if (!gameStarted) {
    return (
      <SetupScreen
        onResume={savedGame ? resumeSavedGame : null}
        onStart={(p) => {
          // Re-assign ids/colors sequentially: removing then re-adding players in
          // setup can otherwise create duplicate ids, which corrupts ownership.
          setPlayers(p.map((pl, i) => ({ ...pl, id: i, color: PLAYER_COLORS[i % PLAYER_COLORS.length] })));
          setProperties(PROPERTIES.map((prop) => ({ ...prop })));
          setDecks(freshDecks());
          setGameLog(['Welcome to ATL Ghetto Monopoly!']);
          setSavedGame(null);
          try {
            localStorage.removeItem(SAVE_KEY);
          } catch {}
          setGameStarted(true);
          setPhase('idle');
        }}
      />
    );
  }

  if (winner) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <TrophyIcon className="w-24 h-24 text-yellow-500 mb-4" />
        <h1 className="text-4xl font-bold mb-2">{winner.name} WINS!</h1>
        <p className="text-zinc-400">Run them pockets.</p>
        <button
          onClick={() => {
            try {
              localStorage.removeItem(SAVE_KEY);
            } catch {}
            window.location.reload();
          }}
          className="mt-8 px-6 py-2 bg-blue-600 rounded-full hover:bg-blue-500"
        >
          Play Again
        </button>
      </div>
    );
  }

  const currentPlayer = players[currentPlayerIndex];
  const pendingProperty =
    pendingPropertyId !== null ? properties.find((p) => p.id === pendingPropertyId) : null;

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col md:flex-row">
      {/* Left Panel: Controls & Stats */}
      <div className="w-full md:w-80 flex-shrink-0 bg-zinc-900/80 border-r border-zinc-800 p-4 flex flex-col gap-4 z-20 backdrop-blur-md">
        <div className="mb-2">
          <h1 className="text-xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 pr-2">
            ATL GHETTO MONOPOLY
          </h1>
          <div className="flex items-center space-x-2 mt-1">
            <span className="px-2 py-0.5 bg-blue-900/50 text-blue-300 text-[10px] rounded border border-blue-800 uppercase tracking-wider">
              Season 1
            </span>
            <span className="text-[10px] text-zinc-500">Fulton County Edition</span>
          </div>
        </div>

        {/* AI Commentary */}
        <div className="bg-black border border-zinc-800 rounded-lg p-3 min-h-[80px] flex items-start space-x-3 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-blue-900/10 opacity-50"></div>
          <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
          <div className="relative z-10">
            <p className="text-xs font-bold text-purple-400 mb-0.5">Hood Announcer</p>
            <p className="text-sm text-zinc-200 leading-snug italic">"{commentary || 'We waiting on a move...'}"</p>
          </div>
        </div>

        {/* Player Stats */}
        <div className="space-y-2">
          {players.map((p, i) => (
            <div
              key={p.id}
              className={`p-3 rounded-lg border transition-all ${
                p.bankrupt
                  ? 'bg-zinc-950 border-red-900/40 opacity-40 grayscale'
                  : currentPlayerIndex === i
                  ? 'bg-zinc-800 border-white/20 shadow-lg scale-[1.02]'
                  : 'bg-zinc-900 border-transparent opacity-60'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6">
                    <GamePiece name={p.token} className={`w-full h-full ${p.color.replace('bg-', 'text-')}`} />
                  </div>
                  <span className="font-bold">{p.name}</span>
                  {currentPlayerIndex === i && !p.bankrupt && (
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  )}
                  {p.inJail && (
                    <span className="text-[9px] uppercase font-bold text-red-400 px-1.5 py-0.5 bg-red-950/50 rounded border border-red-900">
                      Jail
                    </span>
                  )}
                  {p.getOutOfJailCards > 0 && (
                    <span className="text-[9px] font-mono text-yellow-300" title="Get Out of Jail cards">
                      🎟️×{p.getOutOfJailCards}
                    </span>
                  )}
                </div>
                <div className="text-green-400 font-mono font-bold">${p.money}</div>
              </div>
              <div className="flex gap-1 flex-wrap">
                {properties
                  .filter((prop) => prop.owner === p.id)
                  .map((prop) => (
                    <div
                      key={prop.id}
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          prop.group === 'DARK_BLUE'
                            ? 'blue'
                            : prop.group.toLowerCase().replace('_', ''),
                      }}
                    ></div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Game Log */}
        <div
          className="flex-1 bg-black/50 border border-zinc-800 rounded-lg p-2 overflow-y-auto text-xs font-mono text-zinc-400 space-y-1 min-h-[100px]"
          ref={scrollRef}
        >
          {gameLog.map((log, i) => (
            <div key={i} className="border-b border-zinc-800/50 pb-1 last:border-0">
              {log}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="mt-auto pt-4">
          <div className="flex justify-center items-center space-x-4 mb-4">
            <div className="text-center">
              <div className="text-[10px] text-zinc-500 uppercase mb-1">Current Roll</div>
              <div className="flex space-x-2">
                <div className="w-10 h-10 bg-white text-black rounded shadow-lg flex items-center justify-center font-bold text-xl">
                  {dice[0]}
                </div>
                <div className="w-10 h-10 bg-white text-black rounded shadow-lg flex items-center justify-center font-bold text-xl">
                  {dice[1]}
                </div>
              </div>
              {doublesCount > 0 && (
                <div className="text-[10px] text-yellow-400 mt-1 font-bold">
                  Doubles streak: {doublesCount}
                </div>
              )}
            </div>
          </div>

          {phase === 'idle' && (
            <>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={() => setShowPropertyManager(true)}
                  className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center space-x-1"
                  title="Build houses, mortgage properties"
                >
                  <HomeModernIcon className="w-4 h-4 text-green-400" />
                  <span>Manage</span>
                </button>
                <button
                  onClick={() => setShowTradeBuilder(true)}
                  disabled={players.filter((p) => !p.bankrupt && p.id !== players[currentPlayerIndex].id).length === 0}
                  className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center space-x-1"
                  title="Propose a trade to another player"
                >
                  <ArrowsRightLeftIcon className="w-4 h-4 text-blue-400" />
                  <span>Trade</span>
                </button>
              </div>
              {currentPlayer?.inJail ? (
                <div className="space-y-2">
                  <div className="text-center text-[10px] uppercase tracking-widest text-red-400 font-bold">
                    Locked up ({currentPlayer.jailTurns}/3 turns served)
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={payBailEarly}
                      disabled={currentPlayer.money < JAIL_BAIL}
                      className="py-3 bg-yellow-700 hover:bg-yellow-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg font-bold text-xs uppercase tracking-wide transition-colors"
                    >
                      Pay ${JAIL_BAIL} Bail
                    </button>
                    <button
                      onClick={useJailCardEarly}
                      disabled={currentPlayer.getOutOfJailCards < 1}
                      className="py-3 bg-purple-700 hover:bg-purple-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg font-bold text-xs uppercase tracking-wide transition-colors"
                    >
                      Use Card 🎟️
                    </button>
                  </div>
                  <button
                    onClick={handleRoll}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    ROLL FOR DOUBLES
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleRoll}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden group"
                >
                  <span className="relative z-10">ROLL DICE</span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
              )}
            </>
          )}

          {phase === 'debt' && debt && (() => {
            const debtor = players.find((p) => p.id === debt.debtorId);
            const total = debt.entries.reduce((sum, e) => sum + e.amount, 0);
            const cash = debtor?.money ?? 0;
            const canPay = cash >= total;
            return (
              <div className="space-y-2 border border-red-900 bg-red-950/30 rounded-xl p-3">
                <div className="flex items-center space-x-2 text-red-400">
                  <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
                  <div className="text-xs font-bold uppercase tracking-wider">Debt owed</div>
                </div>
                <div className="text-sm text-zinc-300">{debt.reason}</div>
                <div className="flex justify-between text-sm font-mono">
                  <span className="text-zinc-400">Owed</span>
                  <span className="text-red-400 font-bold">${total}</span>
                </div>
                <div className="flex justify-between text-sm font-mono">
                  <span className="text-zinc-400">Cash</span>
                  <span className={canPay ? 'text-green-400 font-bold' : 'text-yellow-400 font-bold'}>${cash}</span>
                </div>
                {!canPay && (
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Sell houses or mortgage properties in the manager to raise cash.
                  </p>
                )}
                <button
                  onClick={() => setShowPropertyManager(true)}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center space-x-1"
                >
                  <HomeModernIcon className="w-4 h-4 text-green-400" />
                  <span>Sell / Mortgage</span>
                </button>
                <button
                  onClick={payDebt}
                  disabled={!canPay}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg font-bold text-sm uppercase tracking-wide transition-all flex items-center justify-center space-x-2"
                >
                  <BanknotesIcon className="w-4 h-4" />
                  <span>Pay ${total}</span>
                </button>
                <button
                  onClick={declareBankruptcy}
                  className="w-full py-2 bg-red-900/60 hover:bg-red-800 rounded-lg font-bold text-xs uppercase tracking-wider text-red-200 transition-colors"
                >
                  Declare Bankruptcy
                </button>
              </div>
            );
          })()}

          {(phase === 'rolling' || phase === 'moving' || phase === 'landed') && (
            <button
              disabled
              className="w-full py-4 bg-zinc-800 rounded-xl font-bold text-lg text-zinc-500 cursor-not-allowed"
            >
              {phase === 'rolling' ? 'Rolling...' : 'Moving...'}
            </button>
          )}

          {phase === 'turnEnd' && (
            <button
              onClick={passControl}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 ${
                extraTurn
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600'
              }`}
            >
              {extraTurn ? (
                <>
                  <ArrowPathIcon className="w-5 h-5" />
                  <span>ROLL AGAIN</span>
                </>
              ) : (
                <>
                  <span>PASS CONTROL</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 relative bg-zinc-950 p-4 md:p-8 flex items-center justify-center overflow-hidden">
        <div
          className="grid gap-1 w-full max-w-[800px] aspect-square"
          style={{
            gridTemplateColumns: 'repeat(11, 1fr)',
            gridTemplateRows: 'repeat(11, 1fr)',
          }}
        >
          {BOARD_TILES.map((tile) => (
            <div key={tile.id} style={getGridStyle(tile.id)} className="relative">
              <TileView
                tile={tile}
                players={players}
                properties={properties}
                onClick={() => handleTileClick(tile)}
              />
            </div>
          ))}

          {/* Center Area */}
          <div className="col-start-2 col-end-11 row-start-2 row-end-11 bg-zinc-900/30 border border-zinc-800/50 rounded-lg flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden relative">
            {selectedPropertyId !== null ? (
              <DeedView
                property={properties.find((p) => p.id === selectedPropertyId)!}
                onClose={() => setSelectedPropertyId(null)}
              />
            ) : (
              <>
                <div className="absolute inset-0 flex items-center justify-center text-6xl md:text-8xl font-black text-zinc-800 select-none tracking-tighter text-center opacity-20 z-0 pointer-events-none">
                  <div>
                    ATL
                    <br />
                    POLY
                  </div>
                </div>

                {currentPlayer && (
                  <div className="z-10 text-center">
                    {/* Color band so the screen-share viewer immediately reads "whose turn" */}
                    <div
                      className={`inline-block px-6 py-2 rounded-full ${currentPlayer.color} mb-4 shadow-lg`}
                    >
                      <div className="flex items-center space-x-3 text-white">
                        <div className="w-6 h-6">
                          <GamePiece name={currentPlayer.token} className="w-full h-full text-white" />
                        </div>
                        <span className="text-xs uppercase font-black tracking-widest">
                          On the move
                        </span>
                      </div>
                    </div>

                    <div className="text-4xl md:text-6xl font-black tracking-tighter text-white drop-shadow-lg">
                      {currentPlayer.name}
                    </div>

                    {/* Phase / status sub-line */}
                    <div className="mt-3 text-sm uppercase tracking-widest text-zinc-400 h-6">
                      {phase === 'idle' && !extraTurn && 'Ready to roll'}
                      {phase === 'idle' && extraTurn && (
                        <span className="text-yellow-400">Doubles — roll again</span>
                      )}
                      {phase === 'rolling' && 'Rolling the dice...'}
                      {phase === 'moving' && (
                        <span className="text-blue-300">Rolled {dice[0] + dice[1]}</span>
                      )}
                      {phase === 'landed' && 'Resolving landing...'}
                      {phase === 'buying' && (
                        <span className="text-green-400">Property up for sale</span>
                      )}
                      {phase === 'cardDraw' && (
                        <span className="text-purple-400">Drawing a card</span>
                      )}
                      {phase === 'turnEnd' && (
                        <span className="text-emerald-400">
                          {extraTurn ? 'Roll again next' : 'Pass control'}
                        </span>
                      )}
                    </div>

                    {/* Big dice readout — visible to the whole table */}
                    <div className="mt-6 flex justify-center items-center space-x-3">
                      <div className="w-14 h-14 md:w-16 md:h-16 bg-white text-black rounded-lg shadow-2xl flex items-center justify-center font-black text-3xl md:text-4xl">
                        {dice[0]}
                      </div>
                      <div className="text-zinc-500 text-2xl">+</div>
                      <div className="w-14 h-14 md:w-16 md:h-16 bg-white text-black rounded-lg shadow-2xl flex items-center justify-center font-black text-3xl md:text-4xl">
                        {dice[1]}
                      </div>
                      <div className="text-zinc-500 text-2xl">=</div>
                      <div className="text-3xl md:text-4xl font-black text-white font-mono">
                        {dice[0] + dice[1]}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Buy Modal */}
      <Modal isOpen={phase === 'buying'} title="Property for Sale" onClose={passProperty}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-zinc-800 rounded-lg mb-4 flex items-center justify-center">
            <BuildingOfficeIcon className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">{pendingProperty?.name}</h2>
          <p className="text-zinc-400 mb-6">
            Price: <span className="text-white font-bold">${pendingProperty?.price}</span>
          </p>

          <div className="flex space-x-3">
            <button
              onClick={passProperty}
              className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-sm font-medium"
            >
              Pass
            </button>
            <button
              onClick={buyProperty}
              className="flex-1 py-2 bg-green-600 hover:bg-green-500 rounded text-sm font-bold"
            >
              Buy It
            </button>
          </div>
        </div>
      </Modal>

      {/* Card Modal */}
      <Modal
        isOpen={phase === 'cardDraw'}
        title={pendingCard?.deck === 'CHANCE' ? 'Chance' : 'Community Chest'}
      >
        <div className="text-center">
          <div className="bg-zinc-800 rounded-lg p-6 mb-6 border border-zinc-700">
            <p className="text-lg text-white italic">"{pendingCard?.card.text}"</p>
          </div>
          <button
            onClick={acknowledgeCard}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded font-bold"
          >
            Continue
          </button>
        </div>
      </Modal>

      {/* Property Manager */}
      {showPropertyManager && currentPlayer && (
        <PropertyManager
          player={currentPlayer}
          properties={properties}
          onClose={() => setShowPropertyManager(false)}
          onBuildHouse={handleBuildHouse}
          onSellHouse={handleSellHouse}
          onMortgage={handleMortgage}
          onUnmortgage={handleUnmortgage}
        />
      )}

      {/* Trade Builder */}
      {showTradeBuilder && currentPlayer && (
        <TradeModal
          fromPlayer={currentPlayer}
          candidatePlayers={players.filter((p) => !p.bankrupt && p.id !== currentPlayer.id)}
          properties={properties}
          onClose={() => setShowTradeBuilder(false)}
          onPropose={handleTradePropose}
        />
      )}

      {/* Trade Review (recipient confirms) */}
      {pendingOffer && (
        <TradeReview
          offer={pendingOffer}
          fromPlayer={players.find((p) => p.id === pendingOffer.fromPlayerId)!}
          toPlayer={players.find((p) => p.id === pendingOffer.toPlayerId)!}
          properties={properties}
          onAccept={handleTradeAccept}
          onReject={handleTradeReject}
        />
      )}
    </div>
  );
};

export default App;
