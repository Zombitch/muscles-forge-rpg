// GDD section 23 — constants cheat sheet
export const HEAT_TARGET = 3.0;
export const EMBER_HEAT = 0.4;
export const EMBER_HEAT_CAP_PER_WEEK = 0.8;
export const FULL_RAID_HEAT = 1.0;
export const COMEBACK_AFTER_DAYS = 5;
export const REBUILD_OFFER_AFTER_DAYS = 14;
export const WELL_FED_HOURS = 24;
export const PIP_CAP = 3;
export const MAX_LETTERS_S6 = 3;
export const COMBO_XP_CAP = 0.4;
export const S1_WEEKS = 12;
export const FESTIVAL_DAYS = 6;
export const HONOR_CLEAN_MASTERY = 1.1;
export const TEMPER_MULT = 0.4;

// GDD 4.3 — temper durations (midpoint of documented range, in hours)
export const HOT_WINDOW_HOURS = 3;
export const TEMPER_HOURS: Record<string, number> = {
  spark: 16,
  brace: 24,
  strength: 44, // squat, hinge, press, overhead, pull, climb
};

// GDD 9.2 — athlete level XP thresholds
export const ATHLETE_LEVEL_THRESHOLDS: { level: number; xp: number; unlock: string }[] = [
  { level: 1, xp: 0, unlock: 'Start' },
  { level: 2, xp: 150, unlock: 'Rest-timer skin' },
  { level: 3, xp: 350, unlock: 'First cosmetic spark' },
  { level: 4, xp: 600, unlock: 'Kitchen three-taps' },
  { level: 5, xp: 900, unlock: 'One-cast swap remembered' },
  { level: 6, xp: 1300, unlock: 'Second Forge room piece' },
];
export const ATHLETE_LEVEL_STEP_AFTER_6 = 500;

// GDD 9.2 — base chapter XP per event
export const CHAPTER_XP = {
  full_raid: 100,
  comeback: 100,
  ember: 25,
  market_run: 20,
  cook_recipe: 10,
  week_lit_bonus: 50,
  boss_beat: 40,
};

// GDD 1.4 / Season 1 — Kitchen phase A unlocks from chapter/season week 3
export const KITCHEN_THREE_TAPS_FROM_WEEK = 3;
export const WELL_FED_SIMPLE_BUFF = 'well_fed_simple';

export const SEASON_1_TITLE = 'Kindler';
