/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { UserIcon } from '@heroicons/react/24/solid';

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

export default GamePiece;
