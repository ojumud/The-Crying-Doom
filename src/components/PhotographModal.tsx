import React, { useState } from 'react';
import { RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { PuzzleSymbolSvg } from './PuzzleSymbolSvg';

interface PhotographModalProps {
  onFlipSound: () => void;
  onFlipped: () => void;
  onClose: () => void;
}

export const PhotographModal: React.FC<PhotographModalProps> = ({
  onFlipSound,
  onFlipped,
  onClose,
}) => {
  const [flipped, setFlipped] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const handleFlip = () => {
    onFlipSound();
    const next = !flipped;
    setFlipped(next);
    if (next) {
      onFlipped();
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/84 p-4">
      <div className="w-full max-w-lg flex flex-col items-center">
        {/* Top Actions */}
        <div className="w-full flex items-center justify-between mb-3 text-xs font-mono-tech uppercase tracking-wider text-zinc-300">
          <span>Old Family Photograph</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomed((z) => !z)}
              className="flex items-center gap-1 px-2.5 py-1 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 cursor-pointer"
            >
              {zoomed ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
              <span>{zoomed ? 'Zoom Out' : 'Inspect Closer'}</span>
            </button>
            <button
              onClick={handleFlip}
              className="flex items-center gap-1 px-2.5 py-1 border border-amber-800/80 bg-amber-950/60 hover:bg-amber-900/70 text-amber-200 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{flipped ? 'View Front' : 'Turn Over'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 cursor-pointer"
              aria-label="Close photograph"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3D Flip Card */}
        <div
          className={`perspective-1000 w-full transition-transform duration-300 ${
            zoomed ? 'scale-110' : 'scale-100'
          }`}
        >
          <div
            className={`relative w-full aspect-[4/3] preserve-3d transition-transform duration-500 ${
              flipped ? 'rotate-y-180' : ''
            }`}
          >
            {/* FRONT: Sepia Portrait with Scratched-Out Face */}
            <div className="absolute inset-0 backface-hidden border-8 border-[#c9bba0] bg-[#2a231c] shadow-2xl overflow-hidden flex flex-col justify-between p-4">
              <svg viewBox="0 0 400 280" className="w-full h-full">
                <defs>
                  <radialGradient id="sepiaVig" cx="50%" cy="45%" r="65%">
                    <stop offset="0%" stopColor="#665846" />
                    <stop offset="100%" stopColor="#1c1611" />
                  </radialGradient>
                </defs>
                <rect width="400" height="280" fill="url(#sepiaVig)" />
                {/* House silhouette behind family */}
                <polygon points="85,105 200,32 315,105" fill="#1e1812" />
                <rect x="105" y="105" width="190" height="125" fill="#241d16" />
                <rect x="132" y="128" width="32" height="44" fill="#3a2f22" />
                <rect x="236" y="128" width="32" height="44" fill="#3a2f22" />
                <rect x="182" y="150" width="36" height="80" fill="#17120e" />

                {/* Left Figure */}
                <g fill="#9e8c72">
                  <circle cx="132" cy="170" r="16" />
                  <path d="M110 250 L116 192 L148 192 L154 250 Z" />
                  <circle cx="127" cy="168" r="2" fill="#241c15" />
                  <circle cx="137" cy="168" r="2" fill="#241c15" />
                </g>

                {/* Center Figure — Scratched-Out Face */}
                <g>
                  <circle cx="200" cy="164" r="18" fill="#8f7d64" />
                  <path d="M174 254 L182 186 L218 186 L226 254 Z" fill="#9e8c72" />
                  {/* Violent dark scratches */}
                  <g stroke="#140f0b" strokeWidth="3.2" strokeLinecap="round">
                    <line x1="184" y1="150" x2="216" y2="176" />
                    <line x1="215" y1="148" x2="185" y2="178" />
                    <line x1="188" y1="144" x2="210" y2="182" />
                    <line x1="180" y1="163" x2="220" y2="161" />
                    <line x1="194" y1="146" x2="204" y2="181" />
                    <line x1="183" y1="170" x2="218" y2="154" />
                  </g>
                </g>

                {/* Right Figure */}
                <g fill="#9e8c72">
                  <circle cx="268" cy="176" r="14" />
                  <path d="M249 250 L255 196 L281 196 L287 250 Z" />
                  <circle cx="264" cy="174" r="2" fill="#241c15" />
                  <circle cx="272" cy="174" r="2" fill="#241c15" />
                </g>
              </svg>
              <div className="text-center text-[11px] font-mono-tech tracking-widest text-[#b8aa90] bg-[#1a1510]/80 py-1">
                One face has been scraped away with something sharp.
              </div>
            </div>

            {/* BACK: Handwritten Message + Tri-Moon Symbol */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 border-8 border-[#b8aa90] bg-[#cfc2a7] text-[#241b13] p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-2xl">
              <div className="font-serif-hand text-xl sm:text-2xl tracking-[0.12em] font-semibold uppercase leading-relaxed max-w-sm">
                &ldquo;WHEN THE CLOCK STOPS, THE DOOR REMEMBERS.&rdquo;
              </div>

              <div className="mt-6 flex flex-col items-center">
                <div className="p-3 border border-[#756248]/60 bg-[#c2b394]/60 text-[#2e1c14]">
                  <PuzzleSymbolSvg symbol="tri_moon" className="w-14 h-14" />
                </div>
                <span className="mt-2 text-[11px] font-mono-tech uppercase tracking-[0.22em] text-[#5e4a35]">
                  Carved Mark Sketched in Ink
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
