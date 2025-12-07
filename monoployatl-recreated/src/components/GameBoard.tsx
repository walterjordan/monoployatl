import React from 'react';
import { BOARD_TILES, Player, Property, Tile } from '@/lib/gameData';
import TileView from './TileView';

const GameBoard = ({ players, properties, onTileClick }: { players: Player[], properties: Property[], onTileClick: (tile: Tile) => void }) => {
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

    return (
        <div 
            className="grid gap-1 w-full max-w-[800px] aspect-square"
            style={{
                gridTemplateColumns: 'repeat(11, 1fr)',
                gridTemplateRows: 'repeat(11, 1fr)'
            }}
        >
            {BOARD_TILES.map(tile => (
                <div key={tile.id} style={getGridStyle(tile.id)} className="relative">
                    <TileView 
                        tile={tile} 
                        players={players} 
                        properties={properties} 
                        currentTurn={0} 
                        onClick={() => onTileClick(tile)}
                    />
                </div>
            ))}
        </div>
    );
};

export default GameBoard;
