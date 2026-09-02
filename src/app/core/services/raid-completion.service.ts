import { Injectable, inject } from '@angular/core';
import { HOT_WINDOW_HOURS, TEMPER_HOURS } from '../constants';
import { RUNES } from '../content/runes.data';
import { Raid, RuneId, RuneMasteryState } from '../models';
import { ComboResult, evaluateCombos } from './combos.util';
import { HeatService } from './heat.service';
import { ProfileStore } from './profile.store';
import { HonorChoice, XpService } from './xp.service';

export interface SlotResult {
  rune_id: RuneId;
  sets_completed: number;
  honor: HonorChoice;
}

export interface RaidCompletionSummary {
  combos: ComboResult;
  chapter_xp_awarded: number;
  heat_awarded: number;
  athlete_level_up: boolean;
  new_athlete_level: number;
}

@Injectable({ providedIn: 'root' })
export class RaidCompletionService {
  private readonly store = inject(ProfileStore);
  private readonly heat = inject(HeatService);
  private readonly xp = inject(XpService);

  complete(raid: Raid, slotResults: SlotResult[]): RaidCompletionSummary {
    const profile = this.store.profile();
    const combos = evaluateCombos(raid, profile);
    const chapterXp = Math.round(raid.chapter_xp_award * (1 + combos.bonus_pct));

    let heatAwarded = this.heat.heatContribution(raid.type, raid.heat_award, profile);
    const isAbsenceEndingType =
      raid.type === 'full' || raid.type === 'comeback' || raid.type.startsWith('hall_');
    if (raid.type === 'comeback' && profile.comeback_awarded_this_absence) {
      heatAwarded = 0;
    }

    const prevLevel = profile.athlete_level;
    const newXp = profile.chapter_xp + chapterXp;
    const newLevel = this.xp.athleteLevelForXp(newXp);

    const runePatch: Partial<Record<RuneId, RuneMasteryState>> = {};
    const now = Date.now();
    for (const result of slotResults) {
      const slot = raid.slots.find((s) => s.rune_id === result.rune_id);
      if (!slot || result.sets_completed <= 0) continue;
      const current = profile.rune_states[result.rune_id];
      const gain = this.xp.runeMasteryGain(
        result.sets_completed,
        slot.load,
        slot.state_at_build,
        result.honor,
      );
      const group = RUNES[result.rune_id].temper_group;
      runePatch[result.rune_id] = {
        state: 'Hot',
        mastery: current.mastery + gain,
        hot_until: now + HOT_WINDOW_HOURS * 3600_000,
        tempering_until: now + TEMPER_HOURS[group] * 3600_000,
      };
    }

    this.store.patch((p) => ({
      ...p,
      chapter_xp: newXp,
      athlete_level: newLevel,
      heat_current: p.heat_current + heatAwarded,
      ember_heat_this_week: p.ember_heat_this_week + (raid.type === 'ember' ? heatAwarded : 0),
      rune_states: { ...p.rune_states, ...runePatch },
      last_full_raid_completed_at: isAbsenceEndingType ? now : p.last_full_raid_completed_at,
      full_raids_lifetime: isAbsenceEndingType ? p.full_raids_lifetime + 1 : p.full_raids_lifetime,
      comeback_awarded_this_absence:
        raid.type === 'comeback'
          ? true
          : isAbsenceEndingType
            ? false
            : p.comeback_awarded_this_absence,
      days_touched: p.days_touched + 1,
    }));

    return {
      combos,
      chapter_xp_awarded: chapterXp,
      heat_awarded: heatAwarded,
      athlete_level_up: newLevel > prevLevel,
      new_athlete_level: newLevel,
    };
  }
}
