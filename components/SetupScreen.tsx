/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { UserPlusIcon, PlusIcon, PlayIcon, TrashIcon, UserIcon } from '@heroicons/react/24/solid';
import GamePiece from './GamePiece';
import MoneyBill from './MoneyBill';
import { Player, TOKENS, PLAYER_COLORS } from '@/lib/gameData';

const SetupScreen = ({ onStart }: { onStart: (players: Player[]) => void }) => {
    const [roster, setRoster] = useState<Player[]>([]);
    const [name, setName] = useState("");
    const [selectedTokenIdx, setSelectedTokenIdx] = useState<number | null>(null);

    const takenTokens = roster.map(p => p.token);

    const handleAdd = () => {
        if (!name || selectedTokenIdx === null) return;
        const token = TOKENS[selectedTokenIdx];
        const newPlayer: Player = {
            id: roster.length,
            name,
            token: token.name, // Use name instead of emoji
            money: 1000,
            position: 0,
            inJail: false,
            jailTurns: 0,
            color: PLAYER_COLORS[roster.length % PLAYER_COLORS.length]
        };
        setRoster([...roster, newPlayer]);
        setName("");
        setSelectedTokenIdx(null);
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
           {/* Header */}
           <h1 className="text-4xl md:text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-8 text-center px-2">
              WHO PLAYIN'?
           </h1>

           <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* Left: Input */}
               <div className="bg-zinc-900/80 p-6 rounded-xl border border-zinc-800 backdrop-blur-md shadow-2xl">
                   <h2 className="text-xl font-bold mb-4 flex items-center text-blue-400"><UserPlusIcon className="w-5 h-5 mr-2" /> New Player</h2>
                   
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
                                        ${isTaken ? 'bg-zinc-900 border-zinc-800 opacity-30 cursor-not-allowed' : 
                                          isSelected ? 'bg-blue-900/30 border-blue-500 ring-2 ring-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 
                                          'bg-zinc-800 border-zinc-700 hover:border-zinc-500 hover:bg-zinc-700'
                                        }
                                     `}
                                   >
                                       <GamePiece name={t.name} className={`w-8 h-8 ${isSelected ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`} />
                                       {isSelected && <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
                                   </button>
                               )
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

               {/* Right: Roster */}
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
                                   <div key={i} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg border border-zinc-700 animate-in fade-in slide-in-from-left-4 duration-300">
                                       <div className="flex items-center space-x-3 flex-1">
                                           <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-black/50 ${p.color.replace('bg-', 'border-2 border-')} p-2`}>
                                               <GamePiece name={p.token} className="w-full h-full text-white" />
                                           </div>
                                           <div>
                                               <div className="font-bold text-lg leading-none mb-1">{p.name}</div>
                                               <div className="text-xs text-zinc-500 font-mono flex items-center space-x-2">
                                                   <span className="text-green-500 font-bold">$1000</span>
                                                   <span className="text-zinc-600">•</span>
                                                   <span className="text-zinc-400">Ready</span>
                                               </div>
                                           </div>
                                       </div>
                                       
                                       <MoneyBill />

                                       <button 
                                         onClick={() => setRoster(roster.filter(r => r.id !== p.id))}
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
}

export default SetupScreen;
