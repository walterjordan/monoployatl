"use client";

import React, { useState } from 'react';
import { Player, Property, Tile, PROPERTIES } from '@/lib/gameData';
import SetupScreen from '@/components/SetupScreen';
import GameBoard from '@/components/GameBoard';
import DeedView from '@/components/DeedView';

const HomePage: React.FC = () => {
    const [gameStarted, setGameStarted] = useState(false);
    const [players, setPlayers] = useState<Player[]>([]);
    const [properties, setProperties] = useState<Property[]>(PROPERTIES);
    const [selectedTile, setSelectedTile] = useState<Tile | null>(null);

    const handleStart = (players: Player[]) => {
        setPlayers(players);
        setGameStarted(true);
    };

    const handleTileClick = (tile: Tile) => {
        setSelectedTile(tile);
    };

    if (!gameStarted) {
        return <SetupScreen onStart={handleStart} />;
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <GameBoard players={players} properties={properties} onTileClick={handleTileClick} />
            {selectedTile && selectedTile.propertyId !== undefined && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <DeedView property={properties.find(p => p.id === selectedTile.propertyId)!} onClose={() => setSelectedTile(null)} />
                </div>
            )}
        </div>
    );
};

export default HomePage;