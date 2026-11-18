export type ClueId =
  | 'clock_1015'
  | 'diary_three_knocks'
  | 'photo_scratched_face'
  | 'photo_back_message'
  | 'recording_voices';

export interface ClueDef {
  id: ClueId;
  title: string;
  detail: string;
  source: string;
}

export const CLUE_DEFINITIONS: Record<ClueId, ClueDef> = {
  clock_1015: {
    id: 'clock_1015',
    title: 'Stopped Wall Clock (10:15)',
    detail:
      'The living room pendulum clock is frozen at exactly 10:15. Its brass gears appear jammed from the inside.',
    source: 'Living Room',
  },
  diary_three_knocks: {
    id: 'diary_three_knocks',
    title: 'Remember the Three Knocks',
    detail:
      'The damaged final entry warns: "If anyone finds this diary, remember the three knocks."',
    source: 'Old Diary',
  },
  photo_scratched_face: {
    id: 'photo_scratched_face',
    title: 'Scratched-Out Figure',
    detail:
      'In the family portrait found upstairs, one figure standing near the porch has had their face scraped away.',
    source: 'Upstairs Bedroom',
  },
  photo_back_message: {
    id: 'photo_back_message',
    title: 'Photograph Message & Sigil',
    detail:
      'Written on the back in fading ink: "WHEN THE CLOCK STOPS, THE DOOR REMEMBERS." Beside it is a carved Tri-Moon Crescent symbol.',
    source: 'Back of Photograph',
  },
  recording_voices: {
    id: 'recording_voices',
    title: 'Mimicked Voices',
    detail:
      'The basement tape claims the crying is not human—and that whatever lives inside the house learns human voices.',
    source: 'Basement Recorder',
  },
};
