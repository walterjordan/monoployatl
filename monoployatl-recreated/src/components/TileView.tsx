/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { HomeIcon, BuildingOfficeIcon } from '@heroicons/react/24/solid';
import GamePiece from './GamePiece';
import { Tile, Player, Property } from '@/lib/gameData';

const TileView = ({ tile, players, properties, currentTurn, onClick }: { tile: Tile, players: Player[], properties: Property[], currentTurn: number, onClick: () => void }) => {
  const property = tile.propertyId !== undefined ? properties.find(p => p.id === tile.propertyId) : null;
  const groupColors: Record<string, string> = {
    'PURPLE': 'bg-purple-900 border-purple-500',
    'LIGHT_BLUE': 'bg-sky-900 border-sky-500',
    'PINK': 'bg-pink-900 border-pink-500',
    'ORANGE': 'bg-orange-900 border-orange-500',
    'RED': 'bg-red-900 border-red-500',
    'YELLOW': 'bg-yellow-900 border-yellow-500',
    'GREEN': 'bg-green-900 border-green-500',
    'DARK_BLUE': 'bg-blue-900 border-blue-500',
    'RAILROAD': 'bg-zinc-800 border-zinc-500',
    'UTILITY': 'bg-slate-800 border-slate-500',
  };

  const colorClass = property ? groupColors[property.group] : 'bg-zinc-900 border-zinc-800';
  const playersHere = players.filter(p => p.position === tile.id);

  return (
    <div 
        onClick={onClick}
        className={`relative flex flex-col items-center justify-between p-1 border ${colorClass} ${playersHere.length > 0 ? 'ring-2 ring-white z-10' : 'opacity-90'} h-full w-full min-h-[60px] rounded-sm text-[9px] sm:text-[10px] select-none cursor-pointer hover:brightness-110 hover:scale-[1.02] transition-all`}
    >
      {property && (
        <div className="absolute top-0 left-0 right-0 flex justify-center items-center space-x-0.5 bg-black/20 p-0.5">
          {property.level < 5 ? (
            Array(property.level).fill(0).map((_, i) => (
              <HomeIcon key={i} className="w-2 h-2 text-green-400" />
            ))
          ) : (
            <BuildingOfficeIcon className="w-4 h-4 text-red-500" />
          )}
        </div>
      )}
      {property && (
         <div className={`w-full h-2 sm:h-3 mb-1 rounded-sm opacity-80 ${colorClass.replace('bg-', 'bg-opacity-100 bg-').split(' ')[0]}`}></div>
      )}
      
      <div className="text-center font-bold leading-tight px-0.5 truncate w-full">{tile.name}</div>
      
      {property && (
        <div className="text-zinc-400 font-mono">${property.price}</div>
      )}

      {/* Player Tokens */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex -space-x-1">
          {playersHere.map(p => (
            <div key={p.id} className="w-6 h-6 sm:w-8 sm:h-8 bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-white/20 p-1" title={p.name}>
              <GamePiece name={p.token} className={`w-full h-full ${p.color.replace('bg-', 'text-')}`} />
            </div>
          ))}
        </div>
      </div>
      
      {/* Owner Marker */}
      {property && property.owner !== null && (
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-tl sm:w-4 sm:h-4 ${players[property.owner].color} border-t border-l border-black`}></div>
      )}
    </div>
  );
};

export default TileView;
