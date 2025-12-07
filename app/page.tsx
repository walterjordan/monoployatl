/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { getGameCommentary } from '@/services/gemini';
import { 
  BuildingOfficeIcon,
  TrophyIcon,
  ChatBubbleBottomCenterTextIcon,
  PlayIcon,
  PlusIcon,
  HomeIcon
} from '@heroicons/react/24/solid';

import { 
  PROPERTIES, 
  BOARD_TILES, 
  PLAYER_COLORS, 
  CHANCE_CARDS, 
  COMMUNITY_CARDS,
  Player,
  Property,
  Tile
} from '@/lib/gameData';

import SetupScreen from '@/components/SetupScreen';
import GamePiece from '@/components/GamePiece';
import MoneyBill from '@/components/MoneyBill';
import DeedView from '@/components/DeedView';
import TileView from '@/components/TileView';
import Modal from '@/components/Modal';

const HomePage: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
    const [players, setPlayers] = useState<Player[]>([]);
  const [properties, setProperties] = useState<Property[]>(PROPERTIES);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [commentary, setCommentary] = useState("");
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [rolling, setRolling] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [pendingPropertyId, setPendingPropertyId] = useState<number | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gameLog]);

  useEffect(() => {
      if (gameStarted) {
          triggerAI("Game Start", "The game has started. Players are on the board.");
          setGameLog(["Welcome to ATL Ghetto Monopoly!"]);
      }
  }, [gameStarted]);

  const addLog = (msg: string) => setGameLog(prev => [...prev, msg]);

  const triggerAI = async (event: string, details: string) => {
      const comment = await getGameCommentary(event, details);
      setCommentary(comment);
  };

  const handleRoll = async () => {
    if (rolling || winner) return;
    setRolling(true);
    setCommentary("");
    
    // Animate dice
    let rolls = 0;
    const interval = setInterval(() => {
        setDice([Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)]);
        rolls++;
        if (rolls > 10) {
            clearInterval(interval);
            finalizeRoll();
        }
    }, 100);
  };

  const finalizeRoll = async () => {
    const d1 = Math.ceil(Math.random() * 6);
    const d2 = Math.ceil(Math.random() * 6);
    const total = d1 + d2;
    setDice([d1, d2]);
    setRolling(false);

    const player = players[currentPlayerIndex];
    
    if (player.inJail) {
        if (d1 === d2) {
            addLog(`${player.name} rolled doubles and got out of jail!`);
            updatePlayer(player.id, { inJail: false, jailTurns: 0 });
            triggerAI("Jail Break", "Player escaped jail with doubles");
        } else {
            addLog(`${player.name} stuck in jail.`);
            if (player.jailTurns >= 2) {
                addLog(`${player.name} paid $50 bail.`);
                updatePlayer(player.id, { inJail: false, jailTurns: 0, money: player.money - 50 });
            } else {
                updatePlayer(player.id, { jailTurns: player.jailTurns + 1 });
            }
            endTurn();
            return;
        }
    }

    // Move
    let newPos = (player.position + total) % 40;
    const passedGo = newPos < player.position;
    
    if (passedGo) {
        addLog(`${player.name} passed GO. Collect $200.`);
        updatePlayer(player.id, { money: player.money + 200 });
    }

    updatePlayer(player.id, { position: newPos });
    handleLanding(player.id, newPos);
  };

  const updatePlayer = (id: number, updates: Partial<Player>) => {
      setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleLanding = async (playerId: number, pos: number) => {
      const tile = BOARD_TILES[pos];
      const player = players.find(p => p.id === playerId)!;
      
      addLog(`${player.name} landed on ${tile.name}.`);

      if (tile.type === 'GO_TO_JAIL') {
          addLog(`${player.name} got locked up!`);
          updatePlayer(playerId, { position: 10, inJail: true });
          triggerAI("Go to Jail", `${player.name} sent to Fulton County`);
          endTurn();
          return;
      }

      if (tile.type === 'TAX') {
          const tax = 100;
          addLog(`${player.name} paid $${tax} tax.`);
          updatePlayer(playerId, { money: player.money - tax });
          triggerAI("Tax", `${player.name} got taxed`);
          endTurn();
          return;
      }

      if (tile.type === 'CHANCE' || tile.type === 'COMMUNITY') {
          const deck = tile.type === 'CHANCE' ? CHANCE_CARDS : COMMUNITY_CARDS;
          const card = deck[Math.floor(Math.random() * deck.length)];
          addLog(`Card: ${card.text}`);
          
          if (card.amount) {
              updatePlayer(playerId, { money: player.money + card.amount });
          }
          if (card.moveId) {
              updatePlayer(playerId, { position: card.moveId });
          }
          triggerAI("Card Draw", card.text);
          endTurn();
          return;
      }

      if (tile.type === 'PROPERTY') {
          const property = properties.find(p => p.id === tile.propertyId)!;
          
          if (property.owner === null) {
              if (player.money >= property.price) {
                  setPendingPropertyId(property.id);
                  setShowBuyModal(true);
                  return; // Wait for user input
              } else {
                  addLog(`${player.name} too broke to buy ${property.name}.`);
                  triggerAI("Too Broke", `${player.name} couldn't afford ${property.name}`);
                  endTurn();
              }
          } else if (property.owner !== playerId) {
              // Pay Rent
              const owner = players.find(p => p.id === property.owner)!;
              
              let rent = 0;
              if (property.group === 'RAILROAD') {
                const ownedCount = properties.filter(p => p.group === 'RAILROAD' && p.owner === property.owner).length;
                rent = property.rent[ownedCount - 1];
              } else if (property.group === 'UTILITY') {
                const ownedCount = properties.filter(p => p.group === 'UTILITY' && p.owner === property.owner).length;
                const rollTotal = dice[0] + dice[1];
                rent = ownedCount === 1 ? rollTotal * 4 : rollTotal * 10;
                if (property.name === "GA Power" && dice[0] === dice[1]) {
                    rent *= 2; // Surge Pricing special rule
                }
              } else {
                rent = property.rent[property.level];
              }

              addLog(`${player.name} pays $${rent} rent to ${owner.name}.`);
              
              updatePlayer(playerId, { money: player.money - rent });
              updatePlayer(owner.id, { money: owner.money + rent });
              
              triggerAI("Pay Rent", `${player.name} paid ${owner.name} $${rent}`);
              
              // Check Bankruptcy
              if (player.money - rent < 0) {
                  addLog(`${player.name} is BANKRUPT!`);
                  setWinner(owner);
              }
              endTurn();
          } else {
              // Owns it
              addLog(`${player.name} owns this spot.`);
              endTurn();
          }
      }
  };

  const buyProperty = () => {
      if (pendingPropertyId === null) return;
      const property = properties.find(p => p.id === pendingPropertyId)!;
      const player = players[currentPlayerIndex];

      updatePlayer(player.id, { money: player.money - property.price });
      setProperties(prev => prev.map(p => p.id === property.id ? { ...p, owner: player.id } : p));
      
      addLog(`${player.name} bought ${property.name} for $${property.price}.`);
      triggerAI("Buy Property", `${player.name} bought ${property.name}`);
      
      setShowBuyModal(false);
      setPendingPropertyId(null);
      endTurn();
  };

  const passProperty = () => {
      addLog(`${players[currentPlayerIndex].name} passed on ${properties.find(p => p.id === pendingPropertyId)?.name}.`);
      setShowBuyModal(false);
      setPendingPropertyId(null);
      endTurn();
  };

  const endTurn = () => {
      setTimeout(() => {
        if (!winner) {
            setCurrentPlayerIndex(prev => (prev + 1) % players.length);
        }
      }, 1500);
  };

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

  // Render Setup Screen if game hasn't started
  if (!gameStarted) {
      return <SetupScreen onStart={(p) => { setPlayers(p); setGameStarted(true); }} />;
  }

  if (winner) {
      return (
          <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
              <TrophyIcon className="w-24 h-24 text-yellow-500 mb-4" />
              <h1 className="text-4xl font-bold mb-2">{winner.name} WINS!</h1>
              <p className="text-zinc-400">Run them pockets.</p>
              <button onClick={() => window.location.reload()} className="mt-8 px-6 py-2 bg-blue-600 rounded-full hover:bg-blue-500">Play Again</button>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col md:flex-row">
      
      {/* Left Panel: Controls & Stats */}
      <div className="w-full md:w-80 flex-shrink-0 bg-zinc-900/80 border-r border-zinc-800 p-4 flex flex-col gap-4 z-20 backdrop-blur-md">
         
         {/* Header */}
         <div className="mb-2">
            <h1 className="text-xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">ATL GHETTO MONOPOLY</h1>
            <div className="flex items-center space-x-2 mt-1">
                <span className="px-2 py-0.5 bg-blue-900/50 text-blue-300 text-[10px] rounded border border-blue-800 uppercase tracking-wider">Season 1</span>
                <span className="text-[10px] text-zinc-500">Fulton County Edition</span>
            </div>
         </div>

         {/* AI Commentary Box */}
         <div className="bg-black border border-zinc-800 rounded-lg p-3 min-h-[80px] flex items-start space-x-3 relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-blue-900/10 opacity-50"></div>
             <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
             <div className="relative z-10">
                 <p className="text-xs font-bold text-purple-400 mb-0.5">Hood Announcer</p>
                 <p className="text-sm text-zinc-200 leading-snug italic">"{commentary || "We waiting on a move..."}"</p>
             </div>
         </div>

         {/* Player Stats */}
         <div className="space-y-2">
             {players.map((p, i) => (
                 <div key={p.id} className={`p-3 rounded-lg border transition-all ${currentPlayerIndex === i ? 'bg-zinc-800 border-white/20 shadow-lg scale-[1.02]' : 'bg-zinc-900 border-transparent opacity-60'}`}>
                     <div className="flex justify-between items-center mb-1">
                         <div className="flex items-center space-x-2">
                             <div className="w-6 h-6">
                                <GamePiece name={p.token} className={`w-full h-full ${p.color.replace('bg-', 'text-')}`} />
                             </div>
                             <span className="font-bold">{p.name}</span>
                             {currentPlayerIndex === i && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
                         </div>
                         <div className="text-green-400 font-mono font-bold">${p.money}</div>
                     </div>
                     <div className="flex gap-1 flex-wrap">
                         {properties.filter(prop => prop.owner === p.id).map(prop => (
                             <div key={prop.id} className="w-2 h-2 rounded-full" style={{backgroundColor: prop.group === 'DARK_BLUE' ? 'blue' : prop.group.toLowerCase().replace('_', '')}}></div>
                         ))}
                     </div>
                 </div>
             ))}
         </div>

         {/* Game Log */}
         <div className="flex-1 bg-black/50 border border-zinc-800 rounded-lg p-2 overflow-y-auto text-xs font-mono text-zinc-400 space-y-1 min-h-[100px]" ref={scrollRef}>
             {gameLog.map((log, i) => (
                 <div key={i} className="border-b border-zinc-800/50 pb-1 last:border-0">{log}</div>
             ))}
         </div>

         {/* Controls */}
         <div className="mt-auto pt-4">
             <div className="flex justify-center items-center space-x-4 mb-4">
                 <div className="text-center">
                     <div className="text-[10px] text-zinc-500 uppercase mb-1">Current Roll</div>
                     <div className="flex space-x-2">
                         <div className="w-10 h-10 bg-white text-black rounded shadow-lg flex items-center justify-center font-bold text-xl">{dice[0]}</div>
                         <div className="w-10 h-10 bg-white text-black rounded shadow-lg flex items-center justify-center font-bold text-xl">{dice[1]}</div>
                     </div>
                 </div>
             </div>
             <button 
                onClick={handleRoll}
                disabled={rolling}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
             >
                <span className="relative z-10">{rolling ? 'Rolling...' : 'ROLL DICE'}</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
             </button>
         </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 relative bg-zinc-950 p-4 md:p-8 flex items-center justify-center overflow-hidden">
          {/* The Board */}
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
                        currentTurn={currentPlayerIndex} 
                        onClick={() => handleTileClick(tile)}
                      />
                  </div>
              ))}
              
              {/* Center Area */}
              <div className="col-start-2 col-end-11 row-start-2 row-end-11 bg-zinc-900/30 border border-zinc-800/50 rounded-lg flex flex-col items-center justify-center p-8 overflow-hidden relative">
                  {selectedPropertyId !== null ? (
                      <DeedView 
                        property={properties.find(p => p.id === selectedPropertyId)!} 
                        onClose={() => setSelectedPropertyId(null)}
                      />
                  ) : (
                      <>
                        <div className="text-6xl md:text-8xl font-black text-zinc-800 select-none tracking-tighter text-center opacity-50 z-0">
                            ATL<br/>POLY
                        </div>
                        <div className="mt-8 text-center z-10">
                            {currentPlayerIndex !== null && players[currentPlayerIndex] && (
                                <div className="text-2xl font-bold text-white animate-pulse">
                                    {players[currentPlayerIndex].name}'s Turn
                                </div>
                            )}
                        </div>
                      </>
                  )}
              </div>
          </div>
      </div>

      {/* Interaction Modals */}
      <Modal isOpen={showBuyModal} title="Property for Sale" onClose={passProperty}>
          <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-zinc-800 rounded-lg mb-4 flex items-center justify-center">
                  <BuildingOfficeIcon className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">{properties.find(p => p.id === pendingPropertyId)?.name}</h2>
              <p className="text-zinc-400 mb-6">Price: <span className="text-white font-bold">${properties.find(p => p.id === pendingPropertyId)?.price}</span></p>
              
              <div className="flex space-x-3">
                  <button onClick={passProperty} className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-sm font-medium">Pass</button>
                  <button onClick={buyProperty} className="flex-1 py-2 bg-green-600 hover:bg-green-500 rounded text-sm font-bold">Buy It</button>
              </div>
          </div>
      </Modal>

    </div>
  );
};

export default HomePage;
