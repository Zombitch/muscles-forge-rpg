import { Injectable } from '@angular/core';
import { EMBER_HEAT_CAP_PER_WEEK, HEAT_TARGET } from '../constants';
import { Profile, RaidType } from '../models';

export type FireState = 'Cold' | 'Spark' | 'Warm' | 'Hot' | 'Lit';

/** GDD 8.2 — fire visual state from the weekly heat sum. */
export function fireState(heatSum: number): FireState {
  if (heatSum >= HEAT_TARGET) return 'Lit';
  if (heatSum >= 2.0) return 'Hot';
  if (heatSum >= 1.0) return 'Warm';
  if (heatSum >= 0.4) return 'Spark';
  return 'Cold';
}

@Injectable({ providedIn: 'root' })
export class HeatService {
  /** How much heat a raid of this type actually contributes, respecting the ember weekly cap (GDD 8.1). */
  heatContribution(type: RaidType, baseHeat: number, profile: Profile): number {
    if (type === 'ember') {
      const remaining = Math.max(0, EMBER_HEAT_CAP_PER_WEEK - profile.ember_heat_this_week);
      return Math.min(baseHeat, remaining);
    }
    if (type === 'festival') return 0; // participation only, GDD 8.1
    return baseHeat;
  }

  isEmber(type: RaidType): boolean {
    return type === 'ember';
  }

  weeklyTarget(): number {
    return HEAT_TARGET;
  }
}
