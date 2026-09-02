import { RuneId } from '../models';

export interface RuneMeta {
  id: RuneId;
  label: string;
  pattern: string;
  /** which temper-duration bucket this rune belongs to (GDD 4.3) */
  temper_group: 'spark' | 'brace' | 'strength';
  /** runes awake for Season 1 (GDD 14.2) */
  awake_s1: boolean;
}

export const RUNES: Record<RuneId, RuneMeta> = {
  squat: {
    id: 'squat',
    label: 'Squat',
    pattern: 'Knee-dominant',
    temper_group: 'strength',
    awake_s1: true,
  },
  hinge: {
    id: 'hinge',
    label: 'Hinge',
    pattern: 'Hip-dominant',
    temper_group: 'strength',
    awake_s1: false,
  },
  press: {
    id: 'press',
    label: 'Press',
    pattern: 'Horizontal push',
    temper_group: 'strength',
    awake_s1: true,
  },
  overhead: {
    id: 'overhead',
    label: 'Overhead',
    pattern: 'Vertical push',
    temper_group: 'strength',
    awake_s1: false,
  },
  pull: {
    id: 'pull',
    label: 'Pull',
    pattern: 'Horizontal pull',
    temper_group: 'strength',
    awake_s1: true,
  },
  climb: {
    id: 'climb',
    label: 'Climb',
    pattern: 'Vertical pull',
    temper_group: 'strength',
    awake_s1: false,
  },
  brace: { id: 'brace', label: 'Brace', pattern: 'Trunk', temper_group: 'brace', awake_s1: true },
  spark: {
    id: 'spark',
    label: 'Spark',
    pattern: 'Conditioning / easy loco',
    temper_group: 'spark',
    awake_s1: true,
  },
};
