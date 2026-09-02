// Forge & Hearth — core domain types (GDD sections 4, 5, 6, 7)

export type RuneId =
  'squat' | 'hinge' | 'press' | 'overhead' | 'pull' | 'climb' | 'brace' | 'spark';

export const ALL_RUNE_IDS: RuneId[] = [
  'squat',
  'hinge',
  'press',
  'overhead',
  'pull',
  'climb',
  'brace',
  'spark',
];

export type RuneRuntimeState = 'Ready' | 'Tempering' | 'Hot' | 'Asleep';

export type ToolId =
  'floor' | 'backpack' | 'bands' | 'dumbbells' | 'machines' | 'bar' | 'pullup_bar';

export const ALL_TOOL_IDS: ToolId[] = [
  'floor',
  'backpack',
  'bands',
  'dumbbells',
  'machines',
  'bar',
  'pullup_bar',
];

export type JointFlag = 'knees' | 'shoulders' | 'back' | 'wrists' | 'none';

export const ALL_JOINT_FLAGS: JointFlag[] = ['knees', 'shoulders', 'back', 'wrists', 'none'];

export type Place = 'home' | 'gym' | 'both';

export type TimeBoxMin = 15 | 25 | 40;

/** A concrete scheme for a set: reps or a hold/duration. */
export interface Scheme {
  kind: 'reps' | 'time';
  low: number;
  high: number;
  /** for time schemes, unit shown to the player */
  unit?: 's' | 'min';
  /** short human label, e.g. "8-10 reps" or "20-30s" */
  label: string;
}

/** One concrete expression of a rune (GDD 4.4). */
export interface Cast {
  id: string;
  rune_id: RuneId;
  rank: 1 | 2 | 3;
  place_tags: Place[];
  tools_required: ToolId[];
  joint_blockers: JointFlag[];
  cues: string[];
  default_scheme: Scheme;
  swap_group: string;
  name: string;
}

export type LoadLanguage = 'light' | 'work' | 'heavy';

export type RaidType =
  'full' | 'hall_anvil' | 'hall_stone' | 'boss' | 'ember' | 'comeback' | 'festival';

export interface RaidSlot {
  cast: Cast;
  rune_id: RuneId;
  sets_planned: number;
  rest_seconds: number;
  load: LoadLanguage;
  /** rune state at the moment the raid was built — drives mastery multiplier */
  state_at_build: RuneRuntimeState;
}

export interface Raid {
  id: string;
  type: RaidType;
  season_id: string;
  planned_rune_ids: RuneId[];
  slots: RaidSlot[];
  time_box_min: TimeBoxMin;
  status: 'offered' | 'in_progress' | 'completed' | 'abandoned';
  heat_award: number;
  chapter_xp_award: number;
  started_at?: number;
  completed_at?: number;
}

export interface RuneMasteryState {
  state: RuneRuntimeState;
  mastery: number;
  hot_until?: number;
  tempering_until?: number;
}

export interface Buff {
  id: string;
  expires_at: number;
}

export interface Profile {
  onboarded: boolean;
  hero_name: string;
  place: Place;
  time_box_min: TimeBoxMin;
  tools: ToolId[];
  joint_flags: JointFlag[];
  week_starts_on: 'monday';

  season_id: string;
  install_at: number;

  athlete_level: number;
  chapter_xp: number;
  cook_rank: number;
  cook_xp: number;

  heat_current: number;
  heat_week_id: string;
  ember_heat_this_week: number;

  titles: string[];
  rune_states: Record<RuneId, RuneMasteryState>;
  buffs_active: Buff[];

  last_full_raid_completed_at?: number;
  comeback_awarded_this_absence: boolean;
  full_raids_lifetime: number;
  raids_since_shard: number;
  days_touched: number;
  illness_until?: number;
}
