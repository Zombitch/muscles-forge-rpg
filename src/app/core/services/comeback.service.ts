import { Injectable } from '@angular/core';
import { COMEBACK_AFTER_DAYS } from '../constants';
import { Profile } from '../models';

@Injectable({ providedIn: 'root' })
export class ComebackService {
  daysSinceLastFullRaid(profile: Profile): number | null {
    if (!profile.last_full_raid_completed_at) return null;
    return Math.floor((Date.now() - profile.last_full_raid_completed_at) / 86400000);
  }

  /** GDD 12 — >= 5 days since last full raid offers a Comeback raid. */
  isComebackEligible(profile: Profile): boolean {
    const days = this.daysSinceLastFullRaid(profile);
    return days !== null && days >= COMEBACK_AFTER_DAYS;
  }
}
