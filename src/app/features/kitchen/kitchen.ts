import { Component, computed, inject } from '@angular/core';
import { KITCHEN_THREE_TAPS_FROM_WEEK } from '../../core/constants';
import { ProfileStore } from '../../core/services/profile.store';

@Component({
  selector: 'app-kitchen',
  imports: [],
  templateUrl: './kitchen.html',
  styleUrl: './kitchen.scss',
})
export class Kitchen {
  private readonly profileStore = inject(ProfileStore);

  readonly profile = this.profileStore.profile;
  readonly seasonWeek = this.profileStore.seasonWeek;
  readonly unlockWeek = KITCHEN_THREE_TAPS_FROM_WEEK;

  readonly unlocked = computed(() => this.seasonWeek() >= this.unlockWeek);
  readonly buffs = computed(() =>
    this.profile().buffs_active.filter((b) => b.expires_at > Date.now()),
  );

  buffLabel(id: string): string {
    return id === 'well_fed_simple' || id === 'well_fed' ? 'Well-Fed' : id;
  }

  hoursLeft(expiresAt: number): number {
    return Math.max(0, Math.ceil((expiresAt - Date.now()) / 3600_000));
  }
}
