import { COMBO_XP_CAP } from '../constants';
import { Profile, Raid } from '../models';

const PUSH_RUNES = new Set(['press', 'overhead']);
const PULL_RUNES = new Set(['pull', 'climb']);

export interface ComboResult {
  ids: string[];
  bonus_pct: number;
}

/** GDD 7.3 — combos evaluated at raid completion. Crumbs stack, capped at +40%. */
export function evaluateCombos(raid: Raid, profile: Profile): ComboResult {
  const runes = new Set(raid.planned_rune_ids);
  const ids: string[] = [];
  let bonus = 0;

  if ([...runes].some((r) => PUSH_RUNES.has(r)) && [...runes].some((r) => PULL_RUNES.has(r))) {
    ids.push('balance');
    bonus += 0.1;
  }
  if (runes.has('squat') && runes.has('hinge')) {
    ids.push('foundation');
    bonus += 0.1;
  }
  if ((raid.type === 'hall_anvil' || raid.type === 'hall_stone') && raid.slots.length > 0) {
    ids.push('hall_clear');
    bonus += 0.15;
  }
  if (raid.slots.length > 0 && raid.slots.every((s) => s.state_at_build === 'Ready')) {
    ids.push('clean_raid');
    bonus += 0.1;
  }
  if (profile.buffs_active.some((b) => b.id === 'well_fed' || b.id === 'well_fed_simple')) {
    ids.push('well_fed');
    bonus += 0.1;
  }

  return { ids, bonus_pct: Math.min(bonus, COMBO_XP_CAP) };
}
