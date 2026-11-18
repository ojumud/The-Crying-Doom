import React from 'react';
import { PuzzleSymbolId } from '../game/types';

interface Props {
  symbol: PuzzleSymbolId;
  className?: string;
}

export const PuzzleSymbolSvg: React.FC<Props> = ({ symbol, className = 'w-8 h-8' }) => {
  switch (symbol) {
    case 'tri_moon':
      return (
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.6" className={className}>
          <circle cx="32" cy="32" r="22" strokeOpacity="0.45" />
          <path d="M36 16 A16 16 0 1 0 36 48 A12 12 0 1 1 36 16 Z" />
          <circle cx="24" cy="32" r="3" fill="currentColor" />
          <path d="M16 14 L16 20 M20 12 L20 20 M24 14 L24 20" strokeWidth="2" />
        </svg>
      );
    case 'hollow_eye':
      return (
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.6" className={className}>
          <path d="M8 32 C18 18, 46 18, 56 32 C46 46, 18 46, 8 32 Z" />
          <circle cx="32" cy="32" r="8" />
          <line x1="32" y1="12" x2="32" y2="52" strokeOpacity="0.6" />
        </svg>
      );
    case 'broken_key':
      return (
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.6" className={className}>
          <circle cx="20" cy="32" r="9" />
          <path d="M29 32 L52 32 M44 32 L44 41 M50 32 L50 39" />
          <path d="M35 24 L39 40" strokeOpacity="0.55" />
        </svg>
      );
    case 'weeping_star':
      return (
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.6" className={className}>
          <polygon points="32,10 37,26 54,26 40,36 45,52 32,42 19,52 24,36 10,26 27,26" />
          <line x1="32" y1="45" x2="32" y2="57" />
        </svg>
      );
    case 'inverted_bell':
      return (
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.6" className={className}>
          <path d="M16 18 L48 18 L42 42 L22 42 Z" />
          <line x1="32" y1="18" x2="32" y2="50" />
          <circle cx="32" cy="52" r="3" />
        </svg>
      );
    case 'spiral_door':
      return (
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.6" className={className}>
          <rect x="18" y="12" width="28" height="40" rx="2" />
          <path d="M32 32 m-2 0 a 2 2 0 1 0 4 0 a 5 5 0 1 0 -10 0 a 8 8 0 1 0 16 0" />
        </svg>
      );
  }
};
