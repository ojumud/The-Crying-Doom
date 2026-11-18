import { ClueId } from '../data/clues';
import { InventoryItemId } from '../data/items';
import { ObjectiveId } from '../data/objectives';

export { CLUE_DEFINITIONS, type ClueDef, type ClueId } from '../data/clues';
export { INVENTORY_ITEMS, type InventoryItemDef, type InventoryItemId } from '../data/items';
export { OBJECTIVES, type ObjectiveDef, type ObjectiveId } from '../data/objectives';

export type ScreenState =
  | 'menu'
  | 'warning'
  | 'intro'
  | 'playing'
  | 'paused'
  | 'diary'
  | 'photograph'
  | 'puzzle'
  | 'inventory'
  | 'ending_sequence'
  | 'chapter_complete';

export type GraphicsQuality = 'high' | 'medium';

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  mouseSensitivity: number;
  graphicsQuality: GraphicsQuality;
  showTouchControls: 'auto' | 'on' | 'off';
  reducedCameraMovement: boolean;
  reducedScreenEffects: boolean;
}

export interface SaveGameData {
  version: number;
  chapter: number;
  playerPos: { x: number; y: number; z: number };
  playerYaw: number;
  playerPitch: number;
  flashlightOn: boolean;
  flashlightBattery: number;
  currentObjective: ObjectiveId;
  inventory: InventoryItemId[];
  clues: ClueId[];
  flags: {
    enteredHouse: boolean;
    frontDoorLocked: boolean;
    diaryRead: boolean;
    clockExamined: boolean;
    livingEventTriggered: boolean;
    photoExamined: boolean;
    photoFlipped: boolean;
    hallwayShadowTriggered: boolean;
    mirrorEventTriggered: boolean;
    basementKeyCollected: boolean;
    basementDoorUnlocked: boolean;
    basementDoorOpen: boolean;
    recordingPlayed: boolean;
    puzzleSolved: boolean;
    compartmentInspected: boolean;
  };
  playTimeSeconds: number;
  savedAt: number;
}

export interface InteractableTarget {
  id: string;
  prompt: string;
  room?: string;
}

export interface SubtitleMessage {
  id: number;
  speaker?: string;
  text: string;
  duration: number;
}

export interface DiscoveryNotification {
  id: number;
  label: string;
  title: string;
}

export const PUZZLE_SYMBOLS = [
  { id: 'tri_moon', name: 'Tri-Moon Crescent' },
  { id: 'hollow_eye', name: 'Hollow Eye' },
  { id: 'broken_key', name: 'Fractured Key' },
  { id: 'weeping_star', name: 'Weeping Star' },
  { id: 'inverted_bell', name: 'Silent Bell' },
  { id: 'spiral_door', name: 'Spiral Threshold' },
] as const;

export type PuzzleSymbolId = (typeof PUZZLE_SYMBOLS)[number]['id'];
