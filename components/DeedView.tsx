/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { PhotoIcon } from '@heroicons/react/24/solid';
import { Property } from '@/lib/gameData';

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
                    {property.group === 'RAILROAD' ? (
                        <div className="space-y-2">
                            <div className="flex justify-between"><span>Rent</span><span>${property.rent[0]}</span></div>
                            <div className="flex justify-between"><span>If 2 Stations are owned</span><span>${property.rent[1]}</span></div>
                            <div className="flex justify-between"><span>If 3 Stations are owned</span><span>${property.rent[2]}</span></div>
                            <div className="flex justify-between"><span>If 4 Stations are owned</span><span>${property.rent[3]}</span></div>
                        </div>
                    ) : property.group === 'UTILITY' ? (
                      <div className="text-center py-4 space-y-2">
                          <p>If one utility is owned, rent is 4 times amount shown on dice.</p>
                          <p>If both utilities are owned, rent is 10 times amount shown on dice.</p>
                          {property.name === "GA Power" && <p className="font-bold mt-2">SURGE PRICING: If you roll doubles, pay double rent.</p>}
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

export default DeedView;
