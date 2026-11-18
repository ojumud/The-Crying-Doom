import React from 'react';
import { Maximize2, X } from 'lucide-react';
import { GameSettings } from '../game/types';

/* ================= PAUSE MODAL ================= */
interface PauseModalProps {
  onResume: () => void;
  onOpenSettings: () => void;
  onRestartChapter: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onOpenSettings,
  onRestartChapter,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#090A0D]/85 p-4">
      <div className="w-full max-w-sm border border-[#777A80]/30 bg-[#17191D] p-7 text-center shadow-2xl">
        <div className="text-[11px] font-mono-tech uppercase tracking-[0.28em] text-[#A8B6C8]">
          Game Paused
        </div>
        <h2 className="font-display text-2xl tracking-[0.2em] text-[#E7E5E1] mt-1 mb-6">
          CRYING DOOM
        </h2>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="py-2.5 bg-[#581D27] hover:bg-[#6e2431] border border-[#777A80]/35 text-[#E7E5E1] text-xs font-mono-tech uppercase tracking-[0.22em] cursor-pointer"
          >
            Resume
          </button>
          <button
            onClick={onOpenSettings}
            className="py-2.5 bg-[#090A0D] hover:bg-[#1f2228] border border-[#777A80]/30 text-[#E7E5E1] text-xs font-mono-tech uppercase tracking-[0.22em] cursor-pointer"
          >
            Settings
          </button>
          <button
            onClick={onRestartChapter}
            className="py-2.5 bg-[#090A0D] hover:bg-[#1f2228] border border-[#777A80]/30 text-[#E7E5E1] text-xs font-mono-tech uppercase tracking-[0.22em] cursor-pointer"
          >
            Restart Chapter
          </button>
          <button
            onClick={onMainMenu}
            className="py-2.5 bg-[#090A0D] hover:bg-[#1f2228] border border-[#777A80]/25 text-[#777A80] hover:text-[#E7E5E1] text-xs font-mono-tech uppercase tracking-[0.22em] cursor-pointer"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= SETTINGS MODAL ================= */
interface SettingsModalProps {
  settings: GameSettings;
  onChange: (next: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onChange,
  onClose,
}) => {
  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        void document.documentElement.requestFullscreen?.();
      } else {
        void document.exitFullscreen?.();
      }
    } catch {
      // Ignore unsupported fullscreen contexts
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090A0D]/88 p-4">
      <div className="w-full max-w-md border border-[#777A80]/30 bg-[#17191D] text-[#E7E5E1] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#777A80]/25 pb-3 mb-5">
          <h2 className="font-display text-xl tracking-[0.18em] uppercase">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 border border-[#777A80]/35 hover:border-[#A8B6C8] text-[#777A80] hover:text-[#E7E5E1] cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 text-xs font-mono-tech">
          <label className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[#E7E5E1]">
              <span>Master Volume</span>
              <span className="tabular-nums text-[#A8B6C8]">{Math.round(settings.masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.masterVolume}
              onChange={(e) => onChange({ ...settings, masterVolume: Number(e.target.value) })}
              className="accent-[#581D27] cursor-pointer"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[#E7E5E1]">
              <span>Music Volume</span>
              <span className="tabular-nums text-[#A8B6C8]">{Math.round(settings.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              onChange={(e) => onChange({ ...settings, musicVolume: Number(e.target.value) })}
              className="accent-[#581D27] cursor-pointer"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[#E7E5E1]">
              <span>Sound Effects &amp; Ambience</span>
              <span className="tabular-nums text-[#A8B6C8]">{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              onChange={(e) => onChange({ ...settings, sfxVolume: Number(e.target.value) })}
              className="accent-[#581D27] cursor-pointer"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[#E7E5E1]">
              <span>Mouse Sensitivity</span>
              <span className="tabular-nums text-[#A8B6C8]">{settings.mouseSensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="2.2"
              step="0.1"
              value={settings.mouseSensitivity}
              onChange={(e) => onChange({ ...settings, mouseSensitivity: Number(e.target.value) })}
              className="accent-[#581D27] cursor-pointer"
            />
          </label>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[#E7E5E1]">Graphics Quality</span>
            <div className="flex gap-1.5">
              {(['medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => onChange({ ...settings, graphicsQuality: q })}
                  className={`px-3 py-1 uppercase border cursor-pointer ${
                    settings.graphicsQuality === q
                      ? 'border-[#581D27] bg-[#581D27]/75 text-[#E7E5E1]'
                      : 'border-[#777A80]/30 bg-[#090A0D] text-[#777A80]'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#E7E5E1]">Mobile Touch Controls</span>
            <div className="flex gap-1">
              {(['auto', 'on', 'off'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onChange({ ...settings, showTouchControls: mode })}
                  className={`px-2.5 py-1 uppercase border cursor-pointer ${
                    settings.showTouchControls === mode
                      ? 'border-[#581D27] bg-[#581D27]/75 text-[#E7E5E1]'
                      : 'border-[#777A80]/30 bg-[#090A0D] text-[#777A80]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Comfort & Accessibility */}
          <div className="border-t border-[#777A80]/25 pt-3 mt-1 space-y-2.5">
            <div className="text-[10px] tracking-[0.24em] uppercase text-[#A8B6C8]">
              Comfort &amp; Accessibility
            </div>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-[#E7E5E1]">Reduced Camera Movement</span>
              <input
                type="checkbox"
                checked={settings.reducedCameraMovement}
                onChange={(e) =>
                  onChange({ ...settings, reducedCameraMovement: e.target.checked })
                }
                className="accent-[#581D27] w-4 h-4 cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-[#E7E5E1]">Reduced Light Flickering</span>
              <input
                type="checkbox"
                checked={settings.reducedScreenEffects}
                onChange={(e) =>
                  onChange({ ...settings, reducedScreenEffects: e.target.checked })
                }
                className="accent-[#581D27] w-4 h-4 cursor-pointer"
              />
            </label>
          </div>

          <button
            onClick={toggleFullscreen}
            className="mt-2 flex items-center justify-center gap-2 py-2 border border-[#777A80]/35 bg-[#090A0D] hover:bg-[#22252B] text-[#E7E5E1] uppercase tracking-wider cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Toggle Fullscreen</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= HOW TO PLAY MODAL ================= */
export const HowToPlayModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090A0D]/88 p-4">
    <div className="w-full max-w-lg border border-[#777A80]/30 bg-[#17191D] text-[#E7E5E1] p-6 shadow-2xl">
      <div className="flex items-center justify-between border-b border-[#777A80]/25 pb-3 mb-4">
        <h2 className="font-display text-xl tracking-[0.18em] uppercase">How To Play</h2>
        <button
          onClick={onClose}
          className="p-1.5 border border-[#777A80]/35 hover:border-[#A8B6C8] text-[#777A80] hover:text-[#E7E5E1] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-sm text-[#E7E5E1]/90 leading-relaxed mb-4">
        You play as <span className="text-[#E7E5E1] font-semibold">Crystal</span>, trapped inside an abandoned house after following strange crying sounds. Explore carefully, examine objects for clues, and unlock the secret hidden in the basement.
      </p>

      <div className="grid grid-cols-2 gap-2.5 text-xs font-mono-tech bg-[#090A0D] border border-[#777A80]/25 p-4 mb-4">
        <div className="text-[#777A80]">Move</div>
        <div className="text-[#E7E5E1]">W A S D / Arrows</div>
        <div className="text-[#777A80]">Look Around</div>
        <div className="text-[#E7E5E1]">Mouse (Click Viewport)</div>
        <div className="text-[#777A80]">Walk Faster</div>
        <div className="text-[#E7E5E1]">Left Shift</div>
        <div className="text-[#777A80]">Interact / Examine</div>
        <div className="text-[#E7E5E1]">E</div>
        <div className="text-[#777A80]">Toggle Flashlight</div>
        <div className="text-[#E7E5E1]">F</div>
        <div className="text-[#777A80]">Inventory &amp; Journal</div>
        <div className="text-[#E7E5E1]">I</div>
        <div className="text-[#777A80]">Pause Menu</div>
        <div className="text-[#E7E5E1]">ESC</div>
      </div>

      <p className="text-xs text-[#A8B6C8] font-serif-hand italic">
        Tip: Pay close attention to stopped clocks, diary entries, and markings on photographs—nothing in this house is a coincidence.
      </p>
    </div>
  </div>
);

/* ================= CREDITS MODAL ================= */
export const CreditsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090A0D]/88 p-4">
    <div className="w-full max-w-md border border-[#777A80]/30 bg-[#17191D] text-[#E7E5E1] p-7 text-center shadow-2xl">
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="p-1.5 border border-[#777A80]/35 hover:border-[#A8B6C8] text-[#777A80] hover:text-[#E7E5E1] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <h2 className="font-display text-2xl tracking-[0.22em] text-[#E7E5E1]">CRYING DOOM</h2>
      <div className="text-[11px] font-mono-tech uppercase tracking-[0.25em] text-[#A8B6C8] mt-1 mb-6">
        Chapter One: The House That Cries
      </div>

      <div className="space-y-3 text-xs text-[#E7E5E1] font-mono-tech">
        <div>
          <div className="text-[#777A80] uppercase">Direction &amp; Narrative</div>
          <div>Crying Doom Indie Studio</div>
        </div>
        <div>
          <div className="text-[#777A80] uppercase">3D Architecture &amp; Lighting</div>
          <div>Three.js Procedural PBR Pipeline</div>
        </div>
        <div>
          <div className="text-[#777A80] uppercase">Sound &amp; Horror Synthesis</div>
          <div>Web Audio Procedural Engine</div>
        </div>
        <div>
          <div className="text-[#777A80] uppercase">Puzzle &amp; Gameplay Systems</div>
          <div>First-Person Mystery Architecture</div>
        </div>
      </div>

      <p className="mt-7 font-serif-hand italic text-[#A8B6C8] text-sm">
        &ldquo;Some cries are warnings. Others are invitations.&rdquo;
      </p>
    </div>
  </div>
);
