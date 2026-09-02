import { Injectable } from '@angular/core';
import {
  ATHLETE_LEVEL_STEP_AFTER_6,
  ATHLETE_LEVEL_THRESHOLDS,
  HONOR_CLEAN_MASTERY,
} from '../constants';
import { LoadLanguage, RuneRuntimeState } from '../models';
import { stateMastery } from './rune-state.util';

export type HonorChoice = 'Clean' | 'Okay' | 'Ugly' | null;

const LOAD_MULT: Record<LoadLanguage, number> = { light: 1.0, work: 1.15, heavy: 1.25 };

@Injectable({ providedIn: 'root' })
export class XpService {
  /** GDD 9.2 — Athlete level from cumulative chapter XP. */
  athleteLevelForXp(xp: number): number {
    let level = 1;
    for (const t of ATHLETE_LEVEL_THRESHOLDS) {
      if (xp >= t.xp) level = t.level;
    }
    const last = ATHLETE_LEVEL_THRESHOLDS[ATHLETE_LEVEL_THRESHOLDS.length - 1];
    if (xp >= last.xp) {
      let extraLevel = last.level;
      let threshold = last.xp;
      while (xp >= threshold + ATHLETE_LEVEL_STEP_AFTER_6) {
        threshold += ATHLETE_LEVEL_STEP_AFTER_6;
        extraLevel += 1;
      }
      level = extraLevel;
    }
    return level;
  }

  xpToNextLevel(
    xp: number,
  ): { next_level: number; xp_needed: number; xp_into_level: number; xp_for_level: number } | null {
    const level = this.athleteLevelForXp(xp);
    const known = ATHLETE_LEVEL_THRESHOLDS.find((t) => t.level === level + 1);
    if (known) {
      const current = ATHLETE_LEVEL_THRESHOLDS.find((t) => t.level === level)!.xp;
      return {
        next_level: level + 1,
        xp_needed: known.xp - xp,
        xp_into_level: xp - current,
        xp_for_level: known.xp - current,
      };
    }
    const last = ATHLETE_LEVEL_THRESHOLDS[ATHLETE_LEVEL_THRESHOLDS.length - 1];
    const levelsPast6 = level - last.level;
    const floor = last.xp + levelsPast6 * ATHLETE_LEVEL_STEP_AFTER_6;
    const ceil = floor + ATHLETE_LEVEL_STEP_AFTER_6;
    return {
      next_level: level + 1,
      xp_needed: ceil - xp,
      xp_into_level: xp - floor,
      xp_for_level: ATHLETE_LEVEL_STEP_AFTER_6,
    };
  }

  /** GDD 9.2 — rune mastery = 10 x sets_completed x load_mult x state_mult x honor_mult. */
  runeMasteryGain(
    setsCompleted: number,
    load: LoadLanguage,
    stateAtBuild: RuneRuntimeState,
    honor: HonorChoice,
  ): number {
    const honorMult = honor === 'Clean' ? HONOR_CLEAN_MASTERY : 1.0;
    return 10 * setsCompleted * LOAD_MULT[load] * stateMastery(stateAtBuild) * honorMult;
  }
}
