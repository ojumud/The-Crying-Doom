export type ObjectiveId =
  | 'obj_enter_house'
  | 'obj_investigate_living'
  | 'obj_read_diary'
  | 'obj_investigate_crying'
  | 'obj_go_upstairs'
  | 'obj_examine_photo'
  | 'obj_discover_message'
  | 'obj_find_basement_key'
  | 'obj_unlock_basement'
  | 'obj_investigate_recording'
  | 'obj_solve_mechanism'
  | 'obj_discover_compartment'
  | 'obj_survive_final';

export interface ObjectiveDef {
  id: ObjectiveId;
  text: string;
}

export const OBJECTIVES: Record<ObjectiveId, ObjectiveDef> = {
  obj_enter_house: {
    id: 'obj_enter_house',
    text: 'Investigate the crying coming from the abandoned house.',
  },
  obj_investigate_living: {
    id: 'obj_investigate_living',
    text: 'Investigate the house.',
  },
  obj_read_diary: {
    id: 'obj_read_diary',
    text: 'Examine the living room for clues.',
  },
  obj_investigate_crying: {
    id: 'obj_investigate_crying',
    text: 'Find the source of the crying.',
  },
  obj_go_upstairs: {
    id: 'obj_go_upstairs',
    text: 'Find the source of the crying upstairs.',
  },
  obj_examine_photo: {
    id: 'obj_examine_photo',
    text: 'Search the upstairs bedroom.',
  },
  obj_discover_message: {
    id: 'obj_discover_message',
    text: 'Inspect the back of the old photograph.',
  },
  obj_find_basement_key: {
    id: 'obj_find_basement_key',
    text: 'Find the basement key downstairs.',
  },
  obj_unlock_basement: {
    id: 'obj_unlock_basement',
    text: 'Unlock the basement door.',
  },
  obj_investigate_recording: {
    id: 'obj_investigate_recording',
    text: 'Investigate the basement.',
  },
  obj_solve_mechanism: {
    id: 'obj_solve_mechanism',
    text: 'Unlock the hidden mechanism using your clues.',
  },
  obj_discover_compartment: {
    id: 'obj_discover_compartment',
    text: 'Inspect the hidden basement compartment.',
  },
  obj_survive_final: {
    id: 'obj_survive_final',
    text: 'Turn around.',
  },
};
