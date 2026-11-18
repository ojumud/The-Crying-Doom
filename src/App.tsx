import { useEffect, useRef, useState } from 'react';
import { BasementPuzzleModal } from './components/BasementPuzzleModal';
import { ContentWarningModal } from './components/ContentWarningModal';
import { DiaryModal } from './components/DiaryModal';
import { BlackoutKnockOverlay, EndingScreen } from './components/EndingScreen';
import { HUD } from './components/HUD';
import { InventoryModal } from './components/InventoryModal';
import { MainMenu } from './components/MainMenu';
import {
  CreditsModal,
  HowToPlayModal,
  PauseModal,
  SettingsModal,
} from './components/MenuModals';
import { PhotographModal } from './components/PhotographModal';
import { GameEngine } from './game/GameEngine';
import {
  createInitialSaveData,
  hasSavedGame,
  loadSettings,
  saveSettings,
} from './game/SaveManager';
import {
  DiscoveryNotification,
  GameSettings,
  InteractableTarget,
  InventoryItemId,
  OBJECTIVES,
  SaveGameData,
  ScreenState,
  SubtitleMessage,
} from './game/types';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const discoveryTimerRef = useRef<number | null>(null);

  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [screen, setScreen] = useState<ScreenState>('menu');
  const [hasSave, setHasSave] = useState<boolean>(() => hasSavedGame());
  const [isMuted, setIsMuted] = useState(false);

  const [target, setTarget] = useState<InteractableTarget | null>(null);
  const [objectiveText, setObjectiveText] = useState<string>(
    OBJECTIVES.obj_enter_house.text
  );
  const [subtitle, setSubtitle] = useState<SubtitleMessage | null>(null);
  const [discovery, setDiscovery] = useState<DiscoveryNotification | null>(null);
  const [flashlightOn, setFlashlightOn] = useState(true);
  const [flashlightBattery, setFlashlightBattery] = useState(100);
  const [showIntroTitle, setShowIntroTitle] = useState(false);
  const [blackoutPhase, setBlackoutPhase] = useState<
    'none' | 'black' | 'knock1' | 'knock2' | 'knock3'
  >('none');

  const [saveSnapshot, setSaveSnapshot] = useState<SaveGameData>(() =>
    createInitialSaveData()
  );

  // Sub-modals
  const [menuModal, setMenuModal] = useState<
    'none' | 'settings' | 'how_to_play' | 'credits'
  >('none');
  const [inspectFromInventory, setInspectFromInventory] = useState<
    'none' | 'diary' | 'photograph'
  >('none');

  const [isTouchDevice] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const engine = new GameEngine(mount, loadSettings(), {
      onScreenChange: (next) => {
        setScreen(next);
        if (next === 'menu') {
          setHasSave(hasSavedGame());
        }
      },
      onTargetChange: setTarget,
      onObjectiveChange: (_id, text) => setObjectiveText(text),
      onSubtitle: setSubtitle,
      onDiscovery: (notif) => {
        setDiscovery(notif);
        if (discoveryTimerRef.current) clearTimeout(discoveryTimerRef.current);
        discoveryTimerRef.current = window.setTimeout(() => {
          setDiscovery(null);
        }, 3400);
      },
      onStateSync: (snap) => setSaveSnapshot(snap),
      onFlashlightChange: (on, bat) => {
        setFlashlightOn(on);
        setFlashlightBattery(bat);
      },
      onIntroTitle: setShowIntroTitle,
      onBlackoutKnock: setBlackoutPhase,
    });

    engineRef.current = engine;

    return () => {
      if (discoveryTimerRef.current) clearTimeout(discoveryTimerRef.current);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onEscapeCapture = (e: KeyboardEvent) => {
      if (e.code !== 'Escape') return;
      if (menuModal !== 'none') {
        e.stopImmediatePropagation();
        setMenuModal('none');
      } else if (inspectFromInventory !== 'none') {
        e.stopImmediatePropagation();
        setInspectFromInventory('none');
      } else if (screen === 'warning') {
        e.stopImmediatePropagation();
        engineRef.current?.setScreen('menu');
      }
    };
    window.addEventListener('keydown', onEscapeCapture, true);
    return () => window.removeEventListener('keydown', onEscapeCapture, true);
  }, [menuModal, inspectFromInventory, screen]);

  const handleUpdateSettings = (next: GameSettings) => {
    setSettings(next);
    saveSettings(next);
    engineRef.current?.updateSettings(next);
  };

  const handleToggleMute = () => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.audio.init();
    const nextMuted = !engine.audio.isMuted();
    engine.audio.setMuted(nextMuted);
    setIsMuted(nextMuted);
  };

  const handleRequestNewGame = () => {
    setMenuModal('none');
    setInspectFromInventory('none');
    setScreen('warning');
  };

  const handleStartNewGameConfirmed = () => {
    setMenuModal('none');
    setInspectFromInventory('none');
    engineRef.current?.startNewGame();
  };

  const handleContinue = () => {
    setMenuModal('none');
    setInspectFromInventory('none');
    engineRef.current?.continueGame();
  };

  const handleMainMenu = () => {
    const engine = engineRef.current;
    if (!engine) return;
    if (screen !== 'chapter_complete' && screen !== 'ending_sequence') {
      engine.persistSave();
    }
    setMenuModal('none');
    setInspectFromInventory('none');
    setBlackoutPhase('none');
    setSubtitle(null);
    setTarget(null);
    engine.setScreen('menu');
  };

  const handleInspectInventoryItem = (id: InventoryItemId) => {
    if (id === 'old_diary') {
      engineRef.current?.audio.playPageFlip();
      setInspectFromInventory('diary');
    } else if (id === 'old_photograph') {
      engineRef.current?.audio.playPageFlip();
      setInspectFromInventory('photograph');
    }
  };

  const showTouch =
    settings.showTouchControls === 'on' ||
    (settings.showTouchControls === 'auto' && isTouchDevice);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#090A0D]">
      {/* Isolated WebGL Canvas Container */}
      <div ref={canvasMountRef} className="fixed inset-0 z-0" />

      {/* Main Menu */}
      {screen === 'menu' && (
        <MainMenu
          hasSave={hasSave}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onNewGame={handleRequestNewGame}
          onContinue={handleContinue}
          onOpenSettings={() => setMenuModal('settings')}
          onOpenHowToPlay={() => setMenuModal('how_to_play')}
          onOpenCredits={() => setMenuModal('credits')}
        />
      )}

      {/* Pre-Gameplay Content Warning */}
      {screen === 'warning' && (
        <ContentWarningModal
          onProceed={handleStartNewGameConfirmed}
          onCancel={() => setScreen('menu')}
        />
      )}

      {/* Active Gameplay HUD */}
      {(screen === 'playing' || screen === 'ending_sequence') && (
        <HUD
          objectiveText={objectiveText}
          target={target}
          subtitle={subtitle}
          discovery={discovery}
          flashlightOn={flashlightOn}
          flashlightBattery={flashlightBattery}
          showIntroTitle={showIntroTitle}
          isMuted={isMuted}
          showTouchControls={showTouch}
          isEndingSequence={screen === 'ending_sequence'}
          onToggleMute={handleToggleMute}
          onTouchMove={(x, y) => engineRef.current?.player.setTouchMove(x, y)}
          onTouchLook={(dx, dy) => engineRef.current?.player.addTouchLook(dx, dy)}
          onInteract={() => engineRef.current?.player.onInteractPressed?.()}
          onToggleFlashlight={() => engineRef.current?.player.toggleFlashlight()}
          onOpenInventory={() => engineRef.current?.setScreen('inventory')}
          onOpenPause={() => engineRef.current?.setScreen('paused')}
        />
      )}

      {/* Diary Inspection */}
      {(screen === 'diary' || inspectFromInventory === 'diary') && (
        <DiaryModal
          onPlayPageFlip={() => engineRef.current?.audio.playPageFlip()}
          onClose={(finished) => {
            if (inspectFromInventory === 'diary') {
              setInspectFromInventory('none');
            } else {
              engineRef.current?.onDiaryClosed(finished);
            }
          }}
        />
      )}

      {/* Photograph Inspection */}
      {(screen === 'photograph' || inspectFromInventory === 'photograph') && (
        <PhotographModal
          onFlipSound={() => engineRef.current?.audio.playPageFlip()}
          onFlipped={() => engineRef.current?.onPhotographFlipped()}
          onClose={() => {
            if (inspectFromInventory === 'photograph') {
              setInspectFromInventory('none');
            } else {
              engineRef.current?.onPhotographClosed();
            }
          }}
        />
      )}

      {/* Basement Mechanism Puzzle */}
      {screen === 'puzzle' && (
        <BasementPuzzleModal
          onClickSound={() => engineRef.current?.audio.playMechanismClick()}
          onKnockSound={() => engineRef.current?.audio.playKnock(false)}
          onSolved={() => engineRef.current?.onPuzzleSolved()}
          onClose={() => {
            engineRef.current?.setScreen('playing');
            engineRef.current?.player.requestPointerLock();
          }}
        />
      )}

      {/* Inventory & Evidence Journal */}
      {screen === 'inventory' && inspectFromInventory === 'none' && (
        <InventoryModal
          inventory={saveSnapshot.inventory}
          clues={saveSnapshot.clues}
          onInspectItem={handleInspectInventoryItem}
          onClose={() => {
            engineRef.current?.setScreen('playing');
            engineRef.current?.player.requestPointerLock();
          }}
        />
      )}

      {/* Pause Menu */}
      {screen === 'paused' && menuModal === 'none' && (
        <PauseModal
          onResume={() => {
            engineRef.current?.setScreen('playing');
            engineRef.current?.player.requestPointerLock();
          }}
          onOpenSettings={() => setMenuModal('settings')}
          onRestartChapter={handleStartNewGameConfirmed}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Settings / How To Play / Credits */}
      {menuModal === 'settings' && (
        <SettingsModal
          settings={settings}
          onChange={handleUpdateSettings}
          onClose={() => setMenuModal('none')}
        />
      )}
      {menuModal === 'how_to_play' && (
        <HowToPlayModal onClose={() => setMenuModal('none')} />
      )}
      {menuModal === 'credits' && (
        <CreditsModal onClose={() => setMenuModal('none')} />
      )}

      {/* Cut to Black + Knock Sequence */}
      <BlackoutKnockOverlay phase={blackoutPhase} />

      {/* Chapter One Complete Screen */}
      {screen === 'chapter_complete' && (
        <EndingScreen
          playTimeSeconds={engineRef.current?.saveState.playTimeSeconds ?? saveSnapshot.playTimeSeconds}
          clues={saveSnapshot.clues}
          inventory={saveSnapshot.inventory}
          onReplay={handleStartNewGameConfirmed}
          onMainMenu={handleMainMenu}
        />
      )}
    </div>
  );
}
