import { Injectable, inject } from '@angular/core';
import { CHAPTER_XP, EMBER_HEAT, FULL_RAID_HEAT } from '../constants';
import { Profile, Raid, RaidSlot, RaidType, RuneId, TimeBoxMin } from '../models';
import { ResolverService } from './resolver.service';
import { liveRuneState } from './rune-state.util';

interface TimeBoxTemplate {
  cap: number;
  sets: number;
  rest_seconds: number;
}

// GDD 6.1 — time-box budgets for a full raid
const TIME_BOX_TEMPLATES: Record<TimeBoxMin, TimeBoxTemplate> = {
  15: { cap: 3, sets: 2, rest_seconds: 30 },
  25: { cap: 4, sets: 3, rest_seconds: 45 },
  40: { cap: 5, sets: 3, rest_seconds: 60 },
};

function isAwake(profile: Profile, rune: RuneId): boolean {
  return profile.rune_states[rune].state !== 'Asleep';
}

/** Prefer whichever awake alternate rune is currently Ready; fall back to `primary`. */
function pickPreferred(primary: RuneId, alternate: RuneId, profile: Profile): RuneId {
  const altAwake = isAwake(profile, alternate);
  if (!altAwake) return primary;
  const primaryLive = liveRuneState(profile.rune_states[primary]);
  const altLive = liveRuneState(profile.rune_states[alternate]);
  if (primaryLive !== 'Ready' && altLive === 'Ready') return alternate;
  return primary;
}

@Injectable({ providedIn: 'root' })
export class RaidBuilderService {
  private readonly resolver = inject(ResolverService);

  /** GDD 7.1 — always include lower, push, pull, brace (unlocked); add spark if time_box >= 25. */
  private coreRuneOrder(profile: Profile): RuneId[] {
    const lower = pickPreferred('squat', 'hinge', profile);
    const push = pickPreferred('press', 'overhead', profile);
    const pull = pickPreferred('pull', 'climb', profile);
    const order: RuneId[] = [lower, push, pull, 'brace'];
    if (profile.time_box_min >= 25) order.push('spark');
    return order;
  }

  private buildSlots(runeIds: RuneId[], profile: Profile, sets: number, rest: number): RaidSlot[] {
    const slots: RaidSlot[] = [];
    for (const rune_id of runeIds) {
      const cast = this.resolver.resolveCast(rune_id, profile);
      if (!cast) continue;
      slots.push({
        cast,
        rune_id,
        sets_planned: sets,
        rest_seconds: rest,
        load: 'light',
        state_at_build: liveRuneState(profile.rune_states[rune_id]),
      });
    }
    return slots;
  }

  /** Deterministic pure builder (GDD 20.2): buildRaid(profile, ...) -> Raid. */
  buildFullRaid(profile: Profile): Raid {
    const template = TIME_BOX_TEMPLATES[profile.time_box_min];
    const runeIds = this.coreRuneOrder(profile).slice(0, template.cap);
    const slots = this.buildSlots(runeIds, profile, template.sets, template.rest_seconds);
    return this.newRaid(
      'full',
      profile,
      slots,
      profile.time_box_min,
      FULL_RAID_HEAT,
      CHAPTER_XP.full_raid,
    );
  }

  /** GDD 6.1 — Ember: 6-10 min, 1-2 runes, 2 rounds max. */
  buildEmberRaid(profile: Profile): Raid {
    const runeIds = this.coreRuneOrder(profile).slice(0, 2) as RuneId[];
    const slots = this.buildSlots(runeIds, profile, 2, 30);
    return this.newRaid(
      'ember',
      profile,
      slots,
      profile.time_box_min,
      EMBER_HEAT,
      CHAPTER_XP.ember,
    );
  }

  /** GDD 6.1 / 12 — Comeback: 8 min, 2 easiest Ready runes + easy Spark. */
  buildComebackRaid(profile: Profile): Raid {
    const readyCore = this.coreRuneOrder(profile).filter(
      (r) => liveRuneState(profile.rune_states[r]) === 'Ready',
    );
    const runeIds: RuneId[] = [...readyCore.slice(0, 2), 'spark'];
    const slots = this.buildSlots(runeIds, profile, 1, 30);
    return this.newRaid(
      'comeback',
      profile,
      slots,
      profile.time_box_min,
      FULL_RAID_HEAT,
      CHAPTER_XP.comeback,
    );
  }

  private newRaid(
    type: RaidType,
    profile: Profile,
    slots: RaidSlot[],
    time_box_min: TimeBoxMin,
    heat_award: number,
    chapter_xp_award: number,
  ): Raid {
    return {
      id: crypto.randomUUID(),
      type,
      season_id: profile.season_id,
      planned_rune_ids: slots.map((s) => s.rune_id),
      slots,
      time_box_min,
      status: 'offered',
      heat_award,
      chapter_xp_award,
    };
  }
}
