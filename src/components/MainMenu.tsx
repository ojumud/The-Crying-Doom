import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface MainMenuProps {
  hasSave: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onNewGame: () => void;
  onContinue: () => void;
  onOpenSettings: () => void;
  onOpenHowToPlay: () => void;
  onOpenCredits: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  hasSave,
  isMuted,
  onToggleMute,
  onNewGame,
  onContinue,
  onOpenSettings,
  onOpenHowToPlay,
  onOpenCredits,
}) => {
  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-6 sm:p-12 pointer-events-auto text-[#E7E5E1]">
      {/* Subtle dark gradient framing left side over live 3D house backdrop */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(9,10,13,0.92) 0%, rgba(9,10,13,0.58) 48%, rgba(9,10,13,0.18) 100%)',
        }}
      />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="text-xs tracking-[0.28em] uppercase text-[#777A80] font-mono-tech">
          Chapter One · The House That Cries
        </div>
        <button
          onClick={onToggleMute}
          className="flex items-center gap-2 px-3 py-1.5 border border-[#777A80]/35 bg-[#090A0D]/85 text-[#A8B6C8] hover:text-[#E7E5E1] hover:border-[#A8B6C8]/50 transition-colors text-xs tracking-widest uppercase cursor-pointer"
          aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span>{isMuted ? 'Muted' : 'Audio'}</span>
        </button>
      </div>

      {/* Main Title Lockup & Menu Buttons */}
      <div className="relative z-10 max-w-lg my-auto">
        <div className="mb-4">
          <svg
            viewBox="0 0 540 120"
            className="w-full max-w-[460px] h-auto text-[#E7E5E1] drop-shadow-[0_4px_18px_rgba(0,0,0,0.9)]"
            aria-label="CRYING DOOM"
          >
            <text
              x="0"
              y="68"
              fill="currentColor"
              fontFamily="'Cinzel', Georgia, serif"
              fontSize="58"
              fontWeight="700"
              letterSpacing="6"
            >
              CRYING DOOM
            </text>
            <line x1="2" y1="84" x2="290" y2="84" stroke="#581D27" strokeWidth="2.5" />
            <text
              x="2"
              y="108"
              fill="#A8B6C8"
              fontFamily="'Cinzel', Georgia, serif"
              fontSize="16"
              letterSpacing="5"
            >
              THE HOUSE THAT CRIES
            </text>
          </svg>
        </div>

        <p className="font-serif-hand italic text-lg sm:text-xl text-[#E7E5E1]/85 mb-8 tracking-wide">
          &ldquo;Some cries are warnings. Others are invitations.&rdquo;
        </p>

        <nav className="flex flex-col gap-2.5 max-w-xs">
          <button
            onClick={onNewGame}
            className="group flex items-center justify-between px-5 py-3 bg-[#581D27]/85 hover:bg-[#581D27] border border-[#777A80]/35 text-[#E7E5E1] tracking-[0.22em] text-sm font-medium uppercase transition-all cursor-pointer"
          >
            <span>New Game</span>
            <span className="text-[#A8B6C8] group-hover:translate-x-1 transition-transform text-xs">▶</span>
          </button>

          <button
            onClick={onContinue}
            disabled={!hasSave}
            className={`flex items-center justify-between px-5 py-3 border tracking-[0.22em] text-sm font-medium uppercase transition-all ${
              hasSave
                ? 'bg-[#17191D]/90 hover:bg-[#22252B] border-[#777A80]/40 text-[#E7E5E1] cursor-pointer'
                : 'bg-[#090A0D]/60 border-[#777A80]/20 text-[#777A80]/60 cursor-not-allowed'
            }`}
          >
            <span>Continue</span>
            <span className="text-[11px] font-mono-tech text-[#A8B6C8]">
              {hasSave ? 'Resume' : 'No Save'}
            </span>
          </button>

          <button
            onClick={onOpenSettings}
            className="text-left px-5 py-2.5 bg-[#090A0D]/80 hover:bg-[#17191D] border border-[#777A80]/30 hover:border-[#A8B6C8]/50 text-[#A8B6C8] hover:text-[#E7E5E1] tracking-[0.2em] text-xs uppercase transition-colors cursor-pointer"
          >
            Settings
          </button>

          <button
            onClick={onOpenHowToPlay}
            className="text-left px-5 py-2.5 bg-[#090A0D]/80 hover:bg-[#17191D] border border-[#777A80]/30 hover:border-[#A8B6C8]/50 text-[#A8B6C8] hover:text-[#E7E5E1] tracking-[0.2em] text-xs uppercase transition-colors cursor-pointer"
          >
            How To Play
          </button>

          <button
            onClick={onOpenCredits}
            className="text-left px-5 py-2.5 bg-[#090A0D]/80 hover:bg-[#17191D] border border-[#777A80]/30 hover:border-[#A8B6C8]/50 text-[#A8B6C8] hover:text-[#E7E5E1] tracking-[0.2em] text-xs uppercase transition-colors cursor-pointer"
          >
            Credits
          </button>
        </nav>
      </div>

      {/* Bottom Flat Control Hint Line */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 text-xs text-[#777A80] tracking-widest uppercase font-mono-tech">
        <span>WASD Move · Mouse Look · E Interact · F Flashlight · I Journal · Esc Pause</span>
        <span>Single-Player · First-Person 3D</span>
      </div>
    </div>
  );
};
