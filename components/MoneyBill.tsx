/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

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

export default MoneyBill;
