import { RuneMasteryState, RuneRuntimeState } from '../models';

/** Live rune runtime state, resolving Hot/Tempering windows against the clock (GDD 4.3). */
export function liveRuneState(s: RuneMasteryState, now = Date.now()): RuneRuntimeState {
  if (s.state === 'Asleep') return 'Asleep';
  if (s.hot_until && now < s.hot_until) return 'Hot';
  if (s.tempering_until && now < s.tempering_until) return 'Tempering';
  return 'Ready';
}

/** GDD 4.3 — mastery multiplier is reduced while a rune is Hot/Tempering. */
export function stateMastery(state: RuneRuntimeState): number {
  return state === 'Ready' ? 1.0 : 0.4;
}
