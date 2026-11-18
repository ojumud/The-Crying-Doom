import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Hand, X } from 'lucide-react';
import { PUZZLE_SYMBOLS } from '../game/types';
import { PuzzleSymbolSvg } from './PuzzleSymbolSvg';

interface BasementPuzzleModalProps {
  onClickSound: () => void;
  onKnockSound: () => void;
  onSolved: () => void;
  onClose: () => void;
}

export const BasementPuzzleModal: React.FC<BasementPuzzleModalProps> = ({
  onClickSound,
  onKnockSound,
  onSolved,
  onClose,
}) => {
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [symbolIdx, setSymbolIdx] = useState(1); // Start on non-solution symbol
  const [knocks, setKnocks] = useState(0);
  const [feedback, setFeedback] = useState<string>(
    'Set the dial, align the sigil, then knock upon the wooden panel.'
  );
  const [shudder, setShudder] = useState(false);

  const currentSymbol = PUZZLE_SYMBOLS[symbolIdx];

  const adjustHour = (delta: number) => {
    onClickSound();
    setHour((h) => {
      const next = ((h - 1 + delta + 12) % 12) + 1;
      return next;
    });
    setKnocks(0);
  };

  const adjustMinute = (delta: number) => {
    onClickSound();
    setMinute((m) => (m + delta + 60) % 60);
    setKnocks(0);
  };

  const cycleSymbol = (delta: number) => {
    onClickSound();
    setSymbolIdx((i) => (i + delta + PUZZLE_SYMBOLS.length) % PUZZLE_SYMBOLS.length);
    setKnocks(0);
  };

  const handleKnock = () => {
    onKnockSound();
    const nextKnocks = knocks + 1;
    setKnocks(nextKnocks);

    if (nextKnocks < 3) {
      setFeedback(`Knock ${nextKnocks} echoes behind the wall...`);
      return;
    }

    // Evaluate on 3rd knock
    const clockCorrect = hour === 10 && minute === 15;
    const symbolCorrect = currentSymbol.id === 'tri_moon';

    if (clockCorrect && symbolCorrect) {
      setFeedback('The tumblers release. Something behind the wall is opening...');
      window.setTimeout(() => {
        onSolved();
      }, 550);
    } else {
      setShudder(true);
      setFeedback("The mechanism clicks, then locks back in place. Something isn't right.");
      window.setTimeout(() => {
        setShudder(false);
        setKnocks(0);
      }, 650);
    }
  };

  const hourAngle = ((hour % 12) + minute / 60) * 30;
  const minAngle = minute * 6;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/85 p-4">
      <div
        className={`w-full max-w-2xl border-2 border-[#4d3b27] bg-[#15120f] text-zinc-100 p-6 sm:p-8 shadow-2xl transition-transform ${
          shudder ? 'translate-x-1.5' : ''
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
          <div>
            <div className="text-[11px] font-mono-tech tracking-[0.26em] uppercase text-amber-500/90">
              Basement Wall Mechanism
            </div>
            <h2 className="font-display text-xl tracking-wider text-zinc-100 mt-0.5">
              Hidden Compartment Lock
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white cursor-pointer"
            aria-label="Close puzzle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Two Main Selectors: Clock & Symbol */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {/* 1. Brass Clock Selector */}
          <div className="border border-zinc-800 bg-zinc-950/75 p-4 flex flex-col items-center">
            <span className="text-[11px] font-mono-tech uppercase tracking-[0.2em] text-zinc-400 mb-3">
              I. Clock Selector
            </span>

            {/* SVG Clock Face */}
            <svg viewBox="0 0 140 140" className="w-32 h-32 mb-3">
              <circle cx="70" cy="70" r="62" fill="#1e1913" stroke="#9c7b38" strokeWidth="4" />
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((t) => {
                const a = (t / 12) * Math.PI * 2 - Math.PI / 2;
                return (
                  <line
                    key={t}
                    x1={70 + Math.cos(a) * 50}
                    y1={70 + Math.sin(a) * 50}
                    x2={70 + Math.cos(a) * 57}
                    y2={70 + Math.sin(a) * 57}
                    stroke="#b5944f"
                    strokeWidth={t % 3 === 0 ? 2.5 : 1.2}
                  />
                );
              })}
              {/* Hour hand */}
              <line
                x1="70"
                y1="70"
                x2="70"
                y2="36"
                stroke="#e4cfa0"
                strokeWidth="4"
                strokeLinecap="round"
                transform={`rotate(${hourAngle} 70 70)`}
              />
              {/* Minute hand */}
              <line
                x1="70"
                y1="70"
                x2="70"
                y2="24"
                stroke="#cfa85e"
                strokeWidth="2.5"
                strokeLinecap="round"
                transform={`rotate(${minAngle} 70 70)`}
              />
              <circle cx="70" cy="70" r="4" fill="#9c7b38" />
            </svg>

            <div className="font-mono-tech text-lg text-amber-200 tabular-nums mb-3">
              {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
            </div>

            <div className="flex items-center gap-4 text-xs font-mono-tech">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => adjustHour(-1)}
                  className="px-2 py-1 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 cursor-pointer"
                >
                  -H
                </button>
                <button
                  onClick={() => adjustHour(1)}
                  className="px-2 py-1 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 cursor-pointer"
                >
                  +H
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => adjustMinute(-5)}
                  className="px-2 py-1 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 cursor-pointer"
                >
                  -5M
                </button>
                <button
                  onClick={() => adjustMinute(5)}
                  className="px-2 py-1 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 cursor-pointer"
                >
                  +5M
                </button>
              </div>
            </div>
          </div>

          {/* 2. Carved Symbol Wheel */}
          <div className="border border-zinc-800 bg-zinc-950/75 p-4 flex flex-col items-center justify-between">
            <span className="text-[11px] font-mono-tech uppercase tracking-[0.2em] text-zinc-400">
              II. Engraved Sigil
            </span>

            <div className="my-4 flex items-center gap-4">
              <button
                onClick={() => cycleSymbol(-1)}
                className="p-2 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 cursor-pointer"
                aria-label="Previous symbol"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="w-28 h-28 rounded-full border-2 border-[#755a30] bg-[#1b1610] flex items-center justify-center text-amber-200 shadow-inner">
                <PuzzleSymbolSvg symbol={currentSymbol.id} className="w-16 h-16" />
              </div>

              <button
                onClick={() => cycleSymbol(1)}
                className="p-2 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 cursor-pointer"
                aria-label="Next symbol"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs font-mono-tech uppercase tracking-widest text-zinc-300">
              {currentSymbol.name}
            </div>
          </div>
        </div>

        {/* 3. Wooden Knocking Panel */}
        <div className="border border-[#5c4327] bg-[#211810] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono-tech uppercase tracking-[0.2em] text-amber-400/90">
              III. Wooden Resonance Panel
            </div>
            <p className="text-xs text-zinc-300 mt-1">{feedback}</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex gap-1.5">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={`w-3 h-3 rounded-full border ${
                    knocks >= n
                      ? 'bg-amber-400 border-amber-200'
                      : 'bg-zinc-900 border-zinc-700'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={handleKnock}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#4a321d] hover:bg-[#5e4025] border border-amber-700/70 text-amber-100 text-xs font-mono-tech uppercase tracking-[0.18em] active:scale-95 transition-transform cursor-pointer"
            >
              <Hand className="w-4 h-4" />
              <span>Knock Panel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
