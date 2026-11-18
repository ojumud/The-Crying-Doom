export interface DiaryPageData {
  entryLabel: string;
  text: string;
  damaged?: boolean;
}

export const DIARY_PAGES: DiaryPageData[] = [
  {
    entryLabel: 'ENTRY 1',
    text: 'Something strange has been happening in this house.',
  },
  {
    entryLabel: 'ENTRY 2',
    text: 'I hear crying every night. At first, I thought it was coming from outside.',
  },
  {
    entryLabel: 'ENTRY 3',
    text: 'But last night, I heard it coming from inside my bedroom.',
  },
  {
    entryLabel: 'ENTRY 4',
    text: 'I checked every room. Nobody was there.',
  },
  {
    entryLabel: 'ENTRY 5',
    text: "I think it knows when I'm awake.",
  },
  {
    entryLabel: 'FINAL ENTRY',
    text: 'If anyone finds this diary, remember the three knocks.',
    damaged: true,
  },
];

export const RECORDING_LINES: [number, string][] = [
  [300, '"If you\'re hearing this, you need to understand something."'],
  [2700, '"The crying... it isn\'t human."'],
  [5100, '"It learns our voices."'],
  [7300, '"Don\'t answer when it calls your name."'],
];
