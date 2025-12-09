/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { getGameCommentary } from './services/gemini';
import { 
  BanknotesIcon, 
  BuildingOfficeIcon, 
  UserIcon, 
  MapPinIcon, 
  BoltIcon, 
  TrophyIcon,
  ChatBubbleBottomCenterTextIcon,
  UserPlusIcon,
  PlayIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  PhotoIcon
} from '@heroicons/react/24/solid';

// --- Types ---

type PropertyGroup = 'PURPLE' | 'DARK_BLUE' | 'GREEN' | 'RED' | 'ORANGE' | 'PINK' | 'YELLOW' | 'LIGHT_BLUE' | 'LIGHT_GREEN' | 'WHITE' | 'RAILROAD' | 'UTILITY' | 'SPECIAL';

interface Property {
  id: number;
  name: string;
  price: number;
  rent: number[]; // Base, 1, 2, 3, 4, 5 (Hotel/Lotto)
  group: PropertyGroup;
  owner: number | null; // Player Index
  level: number; // 0 = Base, 1-5 = Upgrades
  image?: string;
  description?: string;
}

interface Tile {
  id: number;
  type: 'PROPERTY' | 'CHANCE' | 'COMMUNITY' | 'TAX' | 'GO' | 'JAIL' | 'FREE_PARKING' | 'GO_TO_JAIL';
  name: string;
  propertyId?: number;
}

interface Player {
  id: number;
  name: string;
  token: string; // This is the name of the token (e.g. "Box Chevy")
  money: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  color: string;
}

interface Card {
  text: string;
  amount?: number;
  moveId?: number;
}

interface Token {
  name: string;
  description: string;
}

// --- Game Data ---

const PROPERTIES: Property[] = [
  // PURPLE
  { id: 0, name: "Ben Hill", price: 60, rent: [2, 10, 30, 90, 160, 250], group: 'PURPLE', owner: null, level: 0 },
  { id: 1, name: "Adamsville", price: 60, rent: [4, 20, 60, 180, 320, 450], group: 'PURPLE', owner: null, level: 0 },
  // LIGHT BLUE
  { id: 2, name: "Campton Road", price: 100, rent: [6, 30, 90, 270, 400, 550], group: 'LIGHT_BLUE', owner: null, level: 0 },
  { id: 3, name: "Camp Creek", price: 100, rent: [6, 30, 90, 270, 400, 550], group: 'LIGHT_BLUE', owner: null, level: 0 },
  { id: 4, name: "SWATS", price: 120, rent: [8, 40, 100, 300, 450, 600], group: 'LIGHT_BLUE', owner: null, level: 0 },
  // PINK
  { id: 5, name: "Edgewood", price: 140, rent: [10, 50, 150, 450, 625, 750], group: 'PINK', owner: null, level: 0 },
  { id: 6, name: "Cabbagetown", price: 140, rent: [10, 50, 150, 450, 625, 750], group: 'PINK', owner: null, level: 0 },
  { id: 7, name: "Old 4th Ward", price: 160, rent: [12, 60, 180, 500, 700, 900], group: 'PINK', owner: null, level: 0 },
  // ORANGE
  { id: 8, name: "Mechanicsville", price: 180, rent: [14, 70, 200, 550, 750, 950], group: 'ORANGE', owner: null, level: 0 },
  { id: 9, name: "Pittsburgh", price: 180, rent: [14, 70, 200, 550, 750, 950], group: 'ORANGE', owner: null, level: 0 },
  { id: 10, name: "Peoplestown", price: 200, rent: [16, 80, 220, 600, 800, 1000], group: 'ORANGE', owner: null, level: 0 },
  // RED
  { id: 11, name: "Bankhead", price: 220, rent: [18, 90, 250, 700, 875, 1050], group: 'RED', owner: null, level: 0 },
  { id: 12, name: "Bowen Homes", price: 220, rent: [18, 90, 250, 700, 875, 1050], group: 'RED', owner: null, level: 0 },
  { id: 13, name: "Simpson Road", price: 240, rent: [20, 100, 300, 750, 925, 1100], group: 'RED', owner: null, level: 0 },
  // YELLOW
  { id: 14, name: "College Park", price: 260, rent: [22, 110, 330, 800, 975, 1150], group: 'YELLOW', owner: null, level: 0 },
  { id: 15, name: "Riverdale", price: 260, rent: [22, 110, 330, 800, 975, 1150], group: 'YELLOW', owner: null, level: 0 },
  { 
    id: 16, 
    name: "Forest Park", 
    price: 280, 
    rent: [24, 120, 360, 850, 1025, 1200], 
    group: 'YELLOW', 
    owner: null, 
    level: 0,
    // TIP: To use your own image, convert it to Base64 (data:image/jpeg;base64,...) and paste it here
    image: "https://images.unsplash.com/photo-1560529178-855d6eb5ad84?q=80&w=800&auto=format&fit=crop", 
    description: "Known for the State Farmers Market and its rich railroad history. A hidden gem with easy access to everything south of the perimeter."
  },
  // GREEN
  { id: 17, name: "EAV", price: 300, rent: [26, 130, 390, 900, 1100, 1275], group: 'GREEN', owner: null, level: 0 },
  { id: 18, name: "Gresham Road", price: 300, rent: [26, 130, 390, 900, 1100, 1275], group: 'GREEN', owner: null, level: 0 },
  { id: 19, name: "Glenwood", price: 320, rent: [28, 150, 450, 1000, 1200, 1400], group: 'GREEN', owner: null, level: 0 },
  // DARK BLUE
  { id: 20, name: "Zone 6", price: 350, rent: [35, 175, 500, 1100, 1300, 1500], group: 'DARK_BLUE', owner: null, level: 0 },
  { id: 21, name: "Kirkwood", price: 400, rent: [50, 200, 600, 1400, 1700, 2000], group: 'DARK_BLUE', owner: null, level: 0 },
  // STATIONS
  { id: 22, name: "Five Points", price: 200, rent: [25, 50, 100, 200, 0, 0], group: 'RAILROAD', owner: null, level: 0 },
  { id: 23, name: "Airport", price: 200, rent: [25, 50, 100, 200, 0, 0], group: 'RAILROAD', owner: null, level: 0 },
  { id: 24, name: "West End", price: 200, rent: [25, 50, 100, 200, 0, 0], group: 'RAILROAD', owner: null, level: 0 },
  { id: 25, name: "Lenox Station", price: 200, rent: [25, 50, 100, 200, 0, 0], group: 'RAILROAD', owner: null, level: 0 },
  // UTILITIES
  { id: 26, name: "GA Power", price: 150, rent: [0, 0, 0, 0, 0, 0], group: 'UTILITY', owner: null, level: 0 },
  { id: 27, name: "Clayton Water", price: 150, rent: [0, 0, 0, 0, 0, 0], group: 'UTILITY', owner: null, level: 0 },
];

// Board Layout Indices (0-39)
const BOARD_TILES: Tile[] = [
  { id: 0, type: 'GO', name: "GO" },
  { id: 1, type: 'PROPERTY', name: "Ben Hill", propertyId: 0 },
  { id: 2, type: 'COMMUNITY', name: "Community Chest" },
  { id: 3, type: 'PROPERTY', name: "Adamsville", propertyId: 1 },
  { id: 4, type: 'TAX', name: "Income Tax" },
  { id: 5, type: 'PROPERTY', name: "Five Points", propertyId: 22 },
  { id: 6, type: 'PROPERTY', name: "Campton Rd", propertyId: 2 },
  { id: 7, type: 'CHANCE', name: "Chance" },
  { id: 8, type: 'PROPERTY', name: "Camp Creek", propertyId: 3 },
  { id: 9, type: 'PROPERTY', name: "SWATS", propertyId: 4 },
  { id: 10, type: 'JAIL', name: "Fulton County Jail" },
  { id: 11, type: 'PROPERTY', name: "Edgewood", propertyId: 5 },
  { id: 12, type: 'PROPERTY', name: "Clayton Water", propertyId: 27 },
  { id: 13, type: 'PROPERTY', name: "Cabbagetown", propertyId: 6 },
  { id: 14, type: 'PROPERTY', name: "Old 4th Ward", propertyId: 7 },
  { id: 15, type: 'PROPERTY', name: "Airport", propertyId: 23 },
  { id: 16, type: 'PROPERTY', name: "Mechanicsville", propertyId: 8 },
  { id: 17, type: 'COMMUNITY', name: "Community Chest" },
  { id: 18, type: 'PROPERTY', name: "Pittsburgh", propertyId: 9 },
  { id: 19, type: 'PROPERTY', name: "Peoplestown", propertyId: 10 },
  { id: 20, type: 'FREE_PARKING', name: "Magic City Parking" },
  { id: 21, type: 'PROPERTY', name: "Bankhead", propertyId: 11 },
  { id: 22, type: 'CHANCE', name: "Chance" },
  { id: 23, type: 'PROPERTY', name: "Bowen Homes", propertyId: 12 },
  { id: 24, type: 'PROPERTY', name: "Simpson Rd", propertyId: 13 },
  { id: 25, type: 'PROPERTY', name: "West End", propertyId: 24 },
  { id: 26, type: 'PROPERTY', name: "College Park", propertyId: 14 },
  { id: 27, type: 'PROPERTY', name: "Riverdale", propertyId: 15 },
  { id: 28, type: 'PROPERTY', name: "GA Power", propertyId: 26 },
  { id: 29, type: 'PROPERTY', name: "Forest Park", propertyId: 16 },
  { id: 30, type: 'GO_TO_JAIL', name: "Go To Jail" },
  { id: 31, type: 'PROPERTY', name: "EAV", propertyId: 17 },
  { id: 32, type: 'PROPERTY', name: "Gresham Rd", propertyId: 18 },
  { id: 33, type: 'COMMUNITY', name: "Community Chest" },
  { id: 34, type: 'PROPERTY', name: "Glenwood", propertyId: 19 },
  { id: 35, type: 'PROPERTY', name: "Lenox Station", propertyId: 25 },
  { id: 36, type: 'CHANCE', name: "Chance" },
  { id: 37, type: 'PROPERTY', name: "Zone 6", propertyId: 20 },
  { id: 38, type: 'TAX', name: "Luxury Tax" },
  { id: 39, type: 'PROPERTY', name: "Kirkwood", propertyId: 21 },
];

const TOKENS: Token[] = [
  { name: "Box Chevy", description: "Heavy metal. Slow but respectful." },
  { name: "Hashbrowns", description: "Scattered, smothered, covered." },
  { name: "Trap Phone", description: "Screen cracked. Money stacked." },
  { name: "Double Cup", description: "Lean with it. Rock with it." },
  { name: "Wing Basket", description: "10 piece lemon pepper wet." },
  { name: "Shopping Bag", description: "Lenox Mall parking lot warrior." },
  { name: "EBT Card", description: "Accepted everywhere... mostly." },
];

const PLAYER_COLORS = [
    "bg-blue-500", "bg-red-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500"
];

const CHANCE_CARDS: Card[] = [
  { text: "Take a shot! Pay $50 for emotional damage.", amount: -50 },
  { text: "Breakthrough on TikTok! Collect $150.", amount: 150 },
  { text: "Lick went wrong. Lose $200.", amount: -200 },
  { text: "Zone 6 Appreciation. Move to Zone 6.", moveId: 37 },
  { text: "New Air Forces. Pay $90.", amount: -90 },
];

const COMMUNITY_CARDS: Card[] = [
  { text: "Traded food stamps. Collect $100.", amount: 100 },
  { text: "Child Support Refund. Collect $200.", amount: 200 },
  { text: "Baby Mama Drama. Pay $150.", amount: -150 },
  { text: "Uncle's scratch-off won. Collect $250.", amount: 250 },
];

// --- Components ---

const GamePiece = ({ name, className = "w-full h-full" }: { name: string, className?: string }) => {
  const commonProps = {
    className: className,
    fill: "currentColor",
    viewBox: "0 0 24 24"
  };

  switch (name) {
    case "Box Chevy":
      return (
        <svg {...commonProps}>
          <path d="M3 10h18v6h-2v2h-2v-2H7v2H5v-2H3v-6zm2-4l2-2h10l2 2v2H5V6z" />
          <circle cx="6" cy="14" r="1.5" fill="transparent" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="18" cy="14" r="1.5" fill="transparent" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "Hashbrowns":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <path d="M8 12h8M12 8v8M9 10l6 4M15 10l-6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    case "Trap Phone":
      return (
        <svg {...commonProps}>
          <rect x="7" y="2" width="10" height="20" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <rect x="9" y="4" width="6" height="6" fill="currentColor" opacity="0.5"/>
          <path d="M9 14h2v2H9v-2zm4 0h2v2h-2v-2zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2z" fill="currentColor"/>
          <path d="M12 2v-2" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      );
    case "Double Cup":
      return (
        <svg {...commonProps}>
          <path d="M7 4l2 16h6l2-16H7z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <path d="M6 7l2 14h8l2-14H6z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <path d="M8 4c0 0 2 4 2 6s2-6 4-2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        </svg>
      );
    case "Wing Basket":
      return (
        <svg {...commonProps}>
          <path d="M6 14c0-4 3-8 3-8s4 2 6 5c2 3 0 6-3 7s-6-4-6-4z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <line x1="9" y1="14" x2="7" y2="18" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M2 18h20l-2 4H4l-2-4z" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/>
        </svg>
      );
    case "Shopping Bag":
      return (
        <svg {...commonProps}>
          <path d="M6 8h12v12H6z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <path d="M9 8V5c0-1.5 1.5-2 3-2s3 .5 3 2v3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <path d="M12 11v2" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      );
    case "EBT Card":
      return (
        <svg {...commonProps}>
          <rect x="2" y="6" width="20" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <rect x="4" y="9" width="3" height="3" fill="currentColor" opacity="0.5"/>
          <line x1="2" y1="14" x2="22" y2="14" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
        </svg>
      );
    default:
      return <UserIcon className={className} />;
  }
};

const MoneyBill = () => (
    <svg viewBox="0 0 300 140" className="w-24 md:w-32 h-auto drop-shadow-md transform rotate-1 hover:rotate-0 transition-transform origin-center ml-auto mr-4 cursor-pointer">
      <defs>
        <pattern id="guilloche" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
           <path d="M0 10 Q 5 0, 10 10 T 20 10" fill="none" stroke="#166534" strokeWidth="0.5" opacity="0.2"/>
        </pattern>
      </defs>
      
      {/* Base Bill */}
      <rect x="2" y="2" width="296" height="136" rx="8" fill="#dcfce7" stroke="#14532d" strokeWidth="2" />
      <rect x="12" y="12" width="276" height="116" rx="4" fill="url(#guilloche)" stroke="#15803d" strokeWidth="2" />
      
      {/* Corners */}
      <text x="25" y="45" fontFamily="monospace" fontWeight="bold" fontSize="32" fill="#14532d">$1k</text>
      <text x="275" y="125" fontFamily="monospace" fontWeight="bold" fontSize="32" fill="#14532d" textAnchor="end">$1k</text>
      <text x="25" y="125" fontFamily="monospace" fontWeight="bold" fontSize="32" fill="#14532d">$1k</text>
      <text x="275" y="45" fontFamily="monospace" fontWeight="bold" fontSize="32" fill="#14532d" textAnchor="end">$1k</text>
  
      {/* Center Oval */}
      <ellipse cx="150" cy="70" rx="55" ry="50" fill="#f0fdf4" stroke="#14532d" strokeWidth="2" />
      
      {/* The "Rapper" (Snowman Icon) */}
      <text x="150" y="75" fontSize="60" textAnchor="middle" dominantBaseline="middle">⛄️</text>
      
      {/* Text Details */}
      <text x="150" y="25" fontSize="14" fontWeight="bold" textAnchor="middle" fill="#14532d" letterSpacing="1" fontFamily="sans-serif">UNITED HOODS OF ATL</text>
      <text x="150" y="115" fontSize="10" fontWeight="bold" textAnchor="middle" fill="#15803d" fontFamily="monospace">IN TRAP WE TRUST</text>
      
      {/* Serial Number */}
      <text x="220" y="90" fontSize="8" fontFamily="monospace" fill="#dc2626" transform="rotate(-10 220,90)">A-T-L-4-0-4</text>
    </svg>
  );

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
           <h1 className="text-4xl md:text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-8 tracking-tighter text-center">
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

const DeedView = ({ property, onClose }: { property: Property, onClose: () => void }) => {
    const groupColors: Record<string, string> = {
        'PURPLE': 'bg-purple-600',
        'LIGHT_BLUE': 'bg-sky-500',
        'PINK': 'bg-pink-500',
        'ORANGE': 'bg-orange-500',
        'RED': 'bg-red-600',
        'YELLOW': 'bg-yellow-400 text-black',
        'GREEN': 'bg-green-600',
        'DARK_BLUE': 'bg-blue-700',
        'RAILROAD': 'bg-zinc-200 text-black',
        'UTILITY': 'bg-slate-300 text-black',
    };
    
    const headerColor = groupColors[property.group] || 'bg-zinc-700';
    const isDarkHeader = !headerColor.includes('text-black');

    return (
        <div className="flex flex-col md:flex-row bg-white text-black rounded-lg overflow-hidden shadow-2xl max-w-2xl w-full mx-4 animate-in zoom-in-95 duration-200">
            {/* Left Side: Image */}
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

            {/* Right Side: Deed */}
            <div className="md:w-1/2 flex flex-col border-l border-zinc-200">
                <div className={`p-4 text-center border-b-2 border-black ${headerColor}`}>
                    <div className="text-xs uppercase font-bold tracking-widest opacity-80 mb-1">Title Deed</div>
                    <div className={`text-2xl font-black uppercase tracking-tight leading-none ${isDarkHeader ? 'text-white' : 'text-black'}`}>{property.name}</div>
                </div>

                <div className="p-4 flex-1 text-xs sm:text-sm font-mono space-y-2">
                    {property.group === 'RAILROAD' || property.group === 'UTILITY' ? (
                        <div className="text-center py-8">
                            <p>Rent depends on number of similar properties owned.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between">
                                <span>Rent</span>
                                <span>${property.rent[0]}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>With 1 Upgrade</span>
                                <span>${property.rent[1]}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>With 2 Upgrades</span>
                                <span>${property.rent[2]}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>With 3 Upgrades</span>
                                <span>${property.rent[3]}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>With 4 Upgrades</span>
                                <span>${property.rent[4]}</span>
                            </div>
                            <div className="flex justify-between font-bold mt-2 pt-2 border-t border-zinc-200">
                                <span>With BIG LOTTO</span>
                                <span>${property.rent[5]}</span>
                            </div>
                        </>
                    )}
                    
                    <div className="mt-4 pt-2 border-t border-zinc-300 text-center text-zinc-500 text-[10px] uppercase">
                        Mortgage Value ${property.price / 2}
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

const Modal = ({ isOpen, title, children, onClose }: { isOpen: boolean, title: string, children: React.ReactNode, onClose?: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-zinc-800 px-4 py-3 border-b border-zinc-700 flex justify-between items-center">
                    <h3 className="font-bold text-white">{title}</h3>
                    {onClose && <button onClick={onClose} className="text-zinc-400 hover:text-white"><XMarkIcon className="w-5 h-5"/></button>}
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- Main App ---

const App: React.FC = () => {
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
              const rent = property.rent[property.level];
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
      } else {
          endTurn();
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

export default App;
