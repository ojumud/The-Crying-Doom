import { GameSettings, SaveGameData } from './types';

const SAVE_KEY = 'crying_doom_ch1_save_v1';
const SETTINGS_KEY = 'crying_doom_settings_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.85,
  musicVolume: 0.65,
  sfxVolume: 0.85,
  mouseSensitivity: 1.0,
  graphicsQuality: 'high',
  showTouchControls: 'auto',
  reducedCameraMovement: false,
  reducedScreenEffects: false,
};

export function createInitialSaveData(): SaveGameData {
  return {
    version: 1,
    chapter: 1,
    playerPos: { x: 0, y: 1.62, z: 13.4 },
    playerYaw: 0,
    playerPitch: 0.04,
    flashlightOn: true,
    flashlightBattery: 100,
    currentObjective: 'obj_enter_house',
    inventory: [],
    clues: [],
    flags: {
      enteredHouse: false,
      frontDoorLocked: false,
      diaryRead: false,
      clockExamined: false,
      livingEventTriggered: false,
      photoExamined: false,
      photoFlipped: false,
      hallwayShadowTriggered: false,
      mirrorEventTriggered: false,
      basementKeyCollected: false,
      basementDoorUnlocked: false,
      basementDoorOpen: false,
      recordingPlayed: false,
      puzzleSolved: false,
      compartmentInspected: false,
    },
    playTimeSeconds: 0,
    savedAt: Date.now(),
  };
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors
  }
}

export function hasSavedGame(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Partial<SaveGameData>;
    return Boolean(parsed && parsed.version === 1 && parsed.playerPos);
  } catch {
    return false;
  }
}

export function loadSavedGame(): SaveGameData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveGameData;
    if (!parsed || parsed.version !== 1 || !parsed.playerPos) return null;
    const base = createInitialSaveData();
    return {
      ...base,
      ...parsed,
      flags: {
        ...base.flags,
        ...(parsed.flags || {}),
      },
    };
  } catch {
    return null;
  }
}

export function saveGame(data: SaveGameData): void {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        ...data,
        savedAt: Date.now(),
      })
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function clearSavedGame(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore
  }
}
