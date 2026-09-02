import { Injectable } from '@angular/core';
import { CASTS } from '../content/casts.data';
import { Cast, Place, Profile, RuneId } from '../models';

function toolsSubset(required: Cast['tools_required'], owned: Profile['tools']): boolean {
  return required.every((t) => owned.includes(t));
}

function placeMatches(tags: Place[], place: Place): boolean {
  if (place === 'both') return true;
  return tags.includes(place);
}

/**
 * GDD 5 — season rank cap. Season 1's verb is "show up" (design law 8: one new
 * verb per season); rank progression is Season 2's verb, so S1 stays at rank 1.
 */
export function seasonRankCap(seasonId: string, _runeId: RuneId): 1 | 2 | 3 {
  if (seasonId === 's1') return 1;
  return 3;
}

/**
 * Cast resolver (GDD section 5, "Resolver algorithm"):
 *   candidates = casts[rune] where tools ⊆ player.tools and place matches
 *                and rank <= season_rank_cap[rune] and joint_blockers ∩ flags == ∅
 *   if candidates empty: drop joint filter, keep tools, pick lowest rank
 *   pick highest rank among remaining
 */
@Injectable({ providedIn: 'root' })
export class ResolverService {
  resolveCast(runeId: RuneId, profile: Profile, skipIds: string[] = []): Cast | undefined {
    const cap = seasonRankCap(profile.season_id, runeId);
    const flags = new Set<Profile['joint_flags'][number]>(
      profile.joint_flags.filter((f) => f !== 'none'),
    );

    const base = CASTS.filter(
      (c) =>
        c.rune_id === runeId &&
        !skipIds.includes(c.id) &&
        toolsSubset(c.tools_required, profile.tools) &&
        placeMatches(c.place_tags, profile.place) &&
        c.rank <= cap,
    );

    let candidates = base.filter((c) => !c.joint_blockers.some((b) => flags.has(b)));

    if (candidates.length === 0) {
      // drop the joint filter, keep tools/place/rank, pick the lowest rank available
      if (base.length === 0) return undefined;
      const lowestRank = Math.min(...base.map((c) => c.rank));
      return base.filter((c) => c.rank === lowestRank)[0];
    }

    const highestRank = Math.max(...candidates.map((c) => c.rank));
    candidates = candidates.filter((c) => c.rank === highestRank);
    return candidates[0];
  }

  /** GDD 6.3 "Skip move" — replace a cast via the resolver, avoiding the one just shown. */
  swapCast(runeId: RuneId, profile: Profile, currentCastId: string): Cast | undefined {
    return this.resolveCast(runeId, profile, [currentCastId]) ?? this.resolveCast(runeId, profile);
  }
}
