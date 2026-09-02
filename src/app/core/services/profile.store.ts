import { Injectable, computed, effect, signal } from '@angular/core';
import {
  ALL_RUNE_IDS,
  Buff,
  JointFlag,
  Place,
  Profile,
  RuneId,
  RuneMasteryState,
  TimeBoxMin,
  ToolId,
} from '../models';
import { RUNES } from '../content/runes.data';

const STORAGE_KEY = 'forge-hearth:profile:v1';

/** ISO-8601 week id, e.g. "2026-W36" (GDD 8.1 — week_starts_on: monday). */
export function isoWeekId(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function defaultRuneStates(): Record<RuneId, RuneMasteryState> {
  const out = {} as Record<RuneId, RuneMasteryState>;
  for (const id of ALL_RUNE_IDS) {
    out[id] = { state: RUNES[id].awake_s1 ? 'Ready' : 'Asleep', mastery: 0 };
  }
  return out;
}

function defaultProfile(): Profile {
  const now = Date.now();
  return {
    onboarded: false,
    hero_name: '',
    place: 'home',
    time_box_min: 25,
    tools: ['floor'],
    joint_flags: ['none'],
    week_starts_on: 'monday',
    season_id: 's1',
    install_at: now,
    athlete_level: 1,
    chapter_xp: 0,
    cook_rank: 0,
    cook_xp: 0,
    heat_current: 0,
    heat_week_id: isoWeekId(new Date(now)),
    ember_heat_this_week: 0,
    titles: [],
    rune_states: defaultRuneStates(),
    buffs_active: [],
    comeback_awarded_this_absence: false,
    full_raids_lifetime: 0,
    raids_since_shard: 0,
    days_touched: 0,
  };
}

function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Profile;
      // merge with defaults so new fields introduced later don't crash old saves
      return {
        ...defaultProfile(),
        ...parsed,
        rune_states: { ...defaultRuneStates(), ...parsed.rune_states },
      };
    }
  } catch {
    // corrupt storage — fall through to a fresh profile
  }
  return defaultProfile();
}

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private readonly _profile = signal<Profile>(loadProfile());
  readonly profile = this._profile.asReadonly();

  readonly seasonWeek = computed(() => {
    const daysSinceInstall = Math.floor((Date.now() - this._profile().install_at) / 86400000);
    return Math.max(1, Math.floor(daysSinceInstall / 7) + 1);
  });

  constructor() {
    effect(() => {
      const p = this._profile();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
      } catch {
        // storage unavailable (private mode / quota) — game still runs in-memory
      }
    });
    this.rollWeekIfNeeded();
  }

  /** Rolls the weekly heat counter over when a new ISO week has begun. */
  rollWeekIfNeeded(): void {
    const currentWeek = isoWeekId(new Date());
    this._profile.update((p) =>
      p.heat_week_id === currentWeek
        ? p
        : { ...p, heat_week_id: currentWeek, heat_current: 0, ember_heat_this_week: 0 },
    );
  }

  completeOnboarding(input: {
    hero_name: string;
    place: Place;
    time_box_min: TimeBoxMin;
    tools: ToolId[];
    joint_flags: JointFlag[];
  }): void {
    this._profile.update((p) => ({
      ...p,
      ...input,
      onboarded: true,
      install_at: Date.now(),
      heat_week_id: isoWeekId(new Date()),
    }));
  }

  updateSettings(
    input: Partial<Pick<Profile, 'place' | 'time_box_min' | 'tools' | 'joint_flags' | 'hero_name'>>,
  ): void {
    this._profile.update((p) => ({ ...p, ...input }));
  }

  setIllnessUntil(until?: number): void {
    this._profile.update((p) => ({ ...p, illness_until: until }));
  }

  addChapterXp(amount: number): void {
    this._profile.update((p) => ({ ...p, chapter_xp: p.chapter_xp + amount }));
  }

  setAthleteLevel(level: number): void {
    this._profile.update((p) => (p.athlete_level === level ? p : { ...p, athlete_level: level }));
  }

  addHeat(fullOrOther: number, emberDelta = 0): void {
    this.rollWeekIfNeeded();
    this._profile.update((p) => ({
      ...p,
      heat_current: p.heat_current + fullOrOther,
      ember_heat_this_week: p.ember_heat_this_week + emberDelta,
    }));
  }

  setRuneStates(patch: Partial<Record<RuneId, RuneMasteryState>>): void {
    this._profile.update((p) => ({ ...p, rune_states: { ...p.rune_states, ...patch } }));
  }

  recordFullRaidCompleted(): void {
    this._profile.update((p) => ({
      ...p,
      last_full_raid_completed_at: Date.now(),
      full_raids_lifetime: p.full_raids_lifetime + 1,
      comeback_awarded_this_absence: false,
    }));
  }

  markComebackAwarded(): void {
    this._profile.update((p) => ({ ...p, comeback_awarded_this_absence: true }));
  }

  addBuff(buff: Buff): void {
    this._profile.update((p) => ({
      ...p,
      buffs_active: [...p.buffs_active.filter((b) => b.id !== buff.id), buff],
    }));
  }

  pruneExpiredBuffs(): void {
    const now = Date.now();
    this._profile.update((p) => {
      const active = p.buffs_active.filter((b) => b.expires_at > now);
      return active.length === p.buffs_active.length ? p : { ...p, buffs_active: active };
    });
  }

  recordLootRoll(gotShard: boolean): void {
    this._profile.update((p) => ({
      ...p,
      raids_since_shard: gotShard ? 0 : p.raids_since_shard + 1,
    }));
  }

  addTitle(title: string): void {
    this._profile.update((p) =>
      p.titles.includes(title) ? p : { ...p, titles: [...p.titles, title] },
    );
  }

  touchToday(): void {
    this._profile.update((p) => ({ ...p, days_touched: p.days_touched + 1 }));
  }

  /** Escape hatch for services that need to apply several changes atomically. */
  patch(fn: (p: Profile) => Profile): void {
    this._profile.update(fn);
  }
}
