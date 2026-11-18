import React from 'react';
import { ClueId, InventoryItemId } from '../game/types';

interface BlackoutKnockProps {
  phase: 'none' | 'black' | 'knock1' | 'knock2' | 'knock3';
}

export const BlackoutKnockOverlay: React.FC<BlackoutKnockProps> = ({ phase }) => {
  if (phase === 'none') return null;

  return (
    <div className="fixed inset-0 z-40 bg-[#090A0D] flex flex-col items-center justify-center gap-6 pointer-events-auto">
      <div className="font-display text-2xl sm:text-4xl tracking-[0.38em] text-[#E7E5E1] uppercase">
        {(phase === 'knock1' || phase === 'knock2' || phase === 'knock3') && (
          <span>KNOCK.</span>
        )}
        {(phase === 'knock2' || phase === 'knock3') && (
          <span className="ml-5">KNOCK.</span>
        )}
        {phase === 'knock3' && (
          <span className="ml-5 text-[#A8B6C8]">KNOCK.</span>
        )}
      </div>
    </div>
  );
};

interface EndingScreenProps {
  playTimeSeconds: number;
  clues: ClueId[];
  inventory: InventoryItemId[];
  onReplay: () => void;
  onMainMenu: () => void;
}

export const EndingScreen: React.FC<EndingScreenProps> = ({
  playTimeSeconds,
  clues,
  inventory,
  onReplay,
  onMainMenu,
}) => {
  const mins = Math.floor(playTimeSeconds / 60);
  const secs = Math.floor(playTimeSeconds % 60);
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const totalScore = clues.length + inventory.length;
  const completionPct = Math.min(100, Math.round((totalScore / 9) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-[#090A0D] flex items-center justify-center p-6 pointer-events-auto text-[#E7E5E1]">
      <div className="w-full max-w-lg border border-[#777A80]/30 bg-[#17191D] p-8 sm:p-10 text-center shadow-2xl">
        <div className="text-xs font-mono-tech uppercase tracking-[0.32em] text-[#A8B6C8] mb-2">
          Chapter One Complete
        </div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-[0.22em] text-[#E7E5E1] font-bold">
          CRYING DOOM
        </h1>
        <div className="h-px w-36 bg-[#581D27] mx-auto my-4" />
        <p className="font-serif-hand italic text-xl text-[#A8B6C8] mb-8">
          &ldquo;It knows you&apos;re here.&rdquo;
        </p>

        <div className="grid grid-cols-2 gap-3 mb-8 text-left">
          <div className="border border-[#777A80]/25 bg-[#090A0D] p-3.5">
            <div className="text-[10px] font-mono-tech uppercase tracking-widest text-[#777A80]">
              Total Play Time
            </div>
            <div className="text-lg font-mono-tech text-[#E7E5E1] tabular-nums mt-0.5">
              {formattedTime}
            </div>
          </div>
          <div className="border border-[#777A80]/25 bg-[#090A0D] p-3.5">
            <div className="text-[10px] font-mono-tech uppercase tracking-widest text-[#777A80]">
              Completion
            </div>
            <div className="text-lg font-mono-tech text-[#A8B6C8] tabular-nums mt-0.5">
              {completionPct}%
            </div>
          </div>
          <div className="border border-[#777A80]/25 bg-[#090A0D] p-3.5">
            <div className="text-[10px] font-mono-tech uppercase tracking-widest text-[#777A80]">
              Clues Discovered
            </div>
            <div className="text-lg font-mono-tech text-[#E7E5E1] tabular-nums mt-0.5">
              {clues.length} / 5
            </div>
          </div>
          <div className="border border-[#777A80]/25 bg-[#090A0D] p-3.5">
            <div className="text-[10px] font-mono-tech uppercase tracking-widest text-[#777A80]">
              Items Collected
            </div>
            <div className="text-lg font-mono-tech text-[#E7E5E1] tabular-nums mt-0.5">
              {inventory.length} / 4
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onReplay}
            className="flex-1 py-3 bg-[#581D27] hover:bg-[#6e2431] border border-[#777A80]/35 text-[#E7E5E1] text-xs font-mono-tech uppercase tracking-[0.22em] cursor-pointer"
          >
            Replay Chapter
          </button>
          <button
            onClick={onMainMenu}
            className="flex-1 py-3 bg-[#090A0D] hover:bg-[#22252B] border border-[#777A80]/30 text-[#A8B6C8] hover:text-[#E7E5E1] text-xs font-mono-tech uppercase tracking-[0.22em] cursor-pointer"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
