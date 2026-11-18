export type InventoryItemId =
  | 'old_diary'
  | 'old_photograph'
  | 'basement_key'
  | 'recording_evidence';

export interface InventoryItemDef {
  id: InventoryItemId;
  name: string;
  description: string;
  inspectable: boolean;
}

export const INVENTORY_ITEMS: Record<InventoryItemId, InventoryItemDef> = {
  old_diary: {
    id: 'old_diary',
    name: 'Old Diary',
    description:
      'A weathered leather journal found on the living room coffee table. Its final page is torn and stained.',
    inspectable: true,
  },
  old_photograph: {
    id: 'old_photograph',
    name: 'Old Family Photograph',
    description:
      'A faded sepia photograph taken outside this house. Someone violently scratched out one of the faces.',
    inspectable: true,
  },
  basement_key: {
    id: 'basement_key',
    name: 'Basement Key',
    description:
      'A heavy tarnished iron key tagged "CELLAR". Cold to the touch.',
    inspectable: false,
  },
  recording_evidence: {
    id: 'recording_evidence',
    name: 'Cassette Tape Evidence',
    description:
      'A warped microcassette recovered from the basement table. The voice warned not to answer when it calls your name.',
    inspectable: false,
  },
};
