import React, { useRef, useState } from 'react';
import { Backpack, Flashlight, Pause, Volume2, VolumeX } from 'lucide-react';
import {
  DiscoveryNotification,
  InteractableTarget,
  SubtitleMessage,
} from '../game/types';

interface HUDProps {
  objectiveText: string;
  target: InteractableTarget | null;
  subtitle: SubtitleMessage | null;
  discovery: DiscoveryNotification | null;
  flashlightOn: boolean;
  flashlightBattery: number;
  showIntroTitle: boolean;
  isMuted: boolean;
  showTouchControls: boolean;
  isEndingSequence: boolean;
  onToggleMute: () => void;
  onTouchMove: (x: number, y: number) => void;
  onTouchLook: (dx: number, dy: number) => void;
  onInteract: () => void;
  onToggleFlashlight: () => void;
  onOpenInventory: () => void;
  onOpenPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  objectiveText,
  target,
  subtitle,
  discovery,
  flashlightOn,
  flashlightBattery,
  showIntroTitle,
  isMuted,
  showTouchControls,
  isEndingSequence,
  onToggleMute,
  onTouchMove,
  onTouchLook,
  onInteract,
  onToggleFlashlight,
  onOpenInventory,
  onOpenPause,
}) => {
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const joyOrigin = useRef<{ x: number; y: number } | null>(null);
  const lookLast = useRef<{ x: number; y: number } | null>(null);

  const handleJoyStart = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    joyOrigin.current = { x: t.clientX, y: t.clientY };
  };

  const handleJoyMove = (e: React.TouchEvent) => {
    if (!joyOrigin.current) return;
    const t = e.changedTouches[0];
    const maxR = 42;
    const dx = t.clientX - joyOrigin.current.x;
    const dy = t.clientY - joyOrigin.current.y;
    const dist = Math.hypot(dx, dy);
    const clamped = dist > maxR ? maxR / dist : 1;
    const cx = dx * clamped;
    const cy = dy * clamped;
    setKnobOffset({ x: cx, y: cy });
    onTouchMove(cx / maxR, -cy / maxR);
  };

  const handleJoyEnd = () => {
    joyOrigin.current = null;
    setKnobOffset({ x: 0, y: 0 });
    onTouchMove(0, 0);
  };

  const handleLookStart = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    lookLast.current = { x: t.clientX, y: t.clientY };
  };

  const handleLookMove = (e: React.TouchEvent) => {
    if (!lookLast.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - lookLast.current.x;
    const dy = t.clientY - lookLast.current.y;
    lookLast.current = { x: t.clientX, y: t.clientY };
    onTouchLook(dx, dy);
  };

  const handleLookEnd = () => {
    lookLast.current = null;
  };

  return (
    <div className="fixed inset-0 z-10 pointer-events-none select-none text-[#E7E5E1]">
      <div className="horror-vignette absolute inset-0" />

      {/* Top-Left Current Objective */}
      <div className="absolute top-5 left-5 max-w-sm">
        <div className="border-l-2 border-[#581D27] bg-[#090A0D]/82 px-3.5 py-2">
          <div className="text-[10px] tracking-[0.26em] uppercase text-[#A8B6C8] font-mono-tech">
            Objective
          </div>
          <div className="text-xs sm:text-sm text-[#E7E5E1] font-medium mt-0.5 leading-snug">
            {objectiveText}
          </div>
        </div>
      </div>

      {/* Top-Right Minimal Controls */}
      {!isEndingSequence && (
        <div className="absolute top-5 right-5 flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onOpenInventory}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#090A0D]/82 border border-[#777A80]/30 hover:border-[#A8B6C8]/50 text-[#A8B6C8] hover:text-[#E7E5E1] text-xs font-mono-tech uppercase cursor-pointer"
            title="Inventory & Journal (I)"
          >
            <Backpack className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">[I] Journal</span>
          </button>
          <button
            onClick={onToggleMute}
            className="p-1.5 bg-[#090A0D]/82 border border-[#777A80]/30 hover:border-[#A8B6C8]/50 text-[#A8B6C8] hover:text-[#E7E5E1] cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            aria-label="Toggle Mute"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onOpenPause}
            className="p-1.5 bg-[#090A0D]/82 border border-[#777A80]/30 hover:border-[#A8B6C8]/50 text-[#A8B6C8] hover:text-[#E7E5E1] cursor-pointer"
            title="Pause (ESC)"
            aria-label="Pause"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Discovery / Clue Notification */}
      {discovery && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[#090A0D]/92 border border-[#514235] px-5 py-2.5 text-center shadow-lg">
          <div className="text-[10px] tracking-[0.28em] uppercase text-[#A8B6C8] font-mono-tech">
            {discovery.label}
          </div>
          <div className="text-sm text-[#E7E5E1] font-medium mt-0.5">{discovery.title}</div>
        </div>
      )}

      {/* Opening Chapter Title Card */}
      {showIntroTitle && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#090A0D]/65">
          <div className="text-center px-6 py-8">
            <div className="font-display text-3xl sm:text-5xl tracking-[0.26em] text-[#E7E5E1] font-bold">
              CRYING DOOM
            </div>
            <div className="h-px w-48 bg-[#581D27] mx-auto my-4" />
            <div className="font-display text-xs sm:text-sm tracking-[0.35em] text-[#A8B6C8] uppercase">
              Chapter One: The House That Cries
            </div>
          </div>
        </div>
      )}

      {/* Center Reticle + Interaction Prompt */}
      {!isEndingSequence && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className={`rounded-full transition-all duration-150 ${
              target
                ? 'w-2.5 h-2.5 border border-[#E7E5E1] bg-[#E7E5E1]/80'
                : 'w-1.5 h-1.5 bg-[#E7E5E1]/55'
            }`}
          />
          {target && (
            <div className="mt-4 px-3 py-1 bg-[#090A0D]/88 border border-[#777A80]/45 text-[#E7E5E1] text-xs tracking-[0.2em] uppercase font-mono-tech">
              <span className="text-[#A8B6C8] font-semibold">[E]</span> {target.prompt}
            </div>
          )}
        </div>
      )}

      {/* Subtitle / Internal Thought */}
      {subtitle && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-[90vw] max-w-xl text-center">
          <div className="inline-block bg-[#090A0D]/90 border border-[#777A80]/30 px-4 py-2">
            {subtitle.speaker && (
              <span className="text-[11px] tracking-[0.2em] uppercase text-[#A8B6C8] font-mono-tech mr-2">
                {subtitle.speaker}:
              </span>
            )}
            <span className="text-sm text-[#E7E5E1] font-serif-hand italic tracking-wide">
              {subtitle.text}
            </span>
          </div>
        </div>
      )}

      {/* Bottom-Left Subtle Flashlight Indicator */}
      {!isEndingSequence && (
        <div className="absolute bottom-4 left-5 flex items-center gap-2.5 bg-[#090A0D]/80 border border-[#777A80]/25 px-3 py-1.5 text-xs font-mono-tech">
          <Flashlight
            className={`w-3.5 h-3.5 ${flashlightOn ? 'text-[#E7E5E1]' : 'text-[#777A80]'}`}
          />
          <span className="text-[#A8B6C8] tabular-nums">
            {flashlightOn ? 'ON' : 'OFF'} · {Math.round(flashlightBattery)}%
          </span>
          <span className="text-[#777A80] hidden sm:inline">[F]</span>
        </div>
      )}

      {/* Mobile Touch Controls */}
      {showTouchControls && !isEndingSequence && (
        <>
          <div
            className="absolute bottom-16 left-6 w-28 h-28 rounded-full border border-[#777A80]/45 bg-[#090A0D]/55 pointer-events-auto flex items-center justify-center touch-none"
            onTouchStart={handleJoyStart}
            onTouchMove={handleJoyMove}
            onTouchEnd={handleJoyEnd}
            onTouchCancel={handleJoyEnd}
          >
            <div
              className="w-11 h-11 rounded-full bg-[#A8B6C8]/40 border border-[#E7E5E1]/60"
              style={{ transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)` }}
            />
          </div>

          <div
            className="absolute top-16 right-0 bottom-28 w-1/2 pointer-events-auto touch-none"
            onTouchStart={handleLookStart}
            onTouchMove={handleLookMove}
            onTouchEnd={handleLookEnd}
          />

          <div className="absolute bottom-16 right-6 flex flex-col gap-2.5 pointer-events-auto">
            {target && (
              <button
                onClick={onInteract}
                className="px-4 py-3 bg-[#581D27]/90 border border-[#777A80]/50 text-[#E7E5E1] text-xs font-mono-tech uppercase tracking-wider"
              >
                {target.prompt}
              </button>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={onToggleFlashlight}
                className="p-3 bg-[#090A0D]/85 border border-[#777A80]/40 text-[#E7E5E1]"
                aria-label="Toggle Flashlight"
              >
                <Flashlight className="w-5 h-5" />
              </button>
              <button
                onClick={onOpenInventory}
                className="p-3 bg-[#090A0D]/85 border border-[#777A80]/40 text-[#E7E5E1]"
                aria-label="Open Journal"
              >
                <Backpack className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
