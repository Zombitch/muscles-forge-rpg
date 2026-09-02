import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RUNES } from '../../core/content/runes.data';
import { ALL_RUNE_IDS, RuneId } from '../../core/models';
import { ComebackService } from '../../core/services/comeback.service';
import { fireState } from '../../core/services/heat.service';
import { ProfileStore } from '../../core/services/profile.store';
import { RaidBuilderService } from '../../core/services/raid-builder.service';
import { RaidSessionService } from '../../core/services/raid-session.service';
import { liveRuneState } from '../../core/services/rune-state.util';
import { XpService } from '../../core/services/xp.service';
import { HEAT_TARGET } from '../../core/constants';

@Component({
  selector: 'app-forge-home',
  imports: [],
  templateUrl: './forge-home.html',
  styleUrl: './forge-home.scss',
})
export class ForgeHome {
  private readonly profileStore = inject(ProfileStore);
  private readonly raidBuilder = inject(RaidBuilderService);
  private readonly raidSession = inject(RaidSessionService);
  private readonly comebackService = inject(ComebackService);
  private readonly xpService = inject(XpService);
  private readonly router = inject(Router);

  readonly profile = this.profileStore.profile;
  readonly runes = RUNES;
  readonly allRuneIds = ALL_RUNE_IDS;
  readonly heatTarget = HEAT_TARGET;
  readonly tipDismissed = signal(false);

  readonly heatSum = computed(() => this.profile().heat_current);
  readonly fire = computed(() => fireState(this.heatSum()));
  readonly isLit = computed(() => this.fire() === 'Lit');

  readonly isComebackEligible = computed(
    () =>
      this.comebackService.isComebackEligible(this.profile()) &&
      !this.profile().comeback_awarded_this_absence,
  );

  readonly daysQuiet = computed(() => this.comebackService.daysSinceLastFullRaid(this.profile()));

  readonly ctaLabel = computed(() =>
    this.isComebackEligible() ? 'Return to the Arena' : 'Enter the Arena',
  );

  readonly levelProgress = computed(() => this.xpService.xpToNextLevel(this.profile().chapter_xp));

  readonly wellFed = computed(() =>
    this.profile().buffs_active.some((b) => b.id === 'well_fed' || b.id === 'well_fed_simple'),
  );

  readonly showSorenessTip = computed(
    () =>
      !this.tipDismissed() &&
      this.profile().full_raids_lifetime >= 2 &&
      this.profile().full_raids_lifetime <= 4,
  );

  runeState(id: RuneId) {
    return liveRuneState(this.profile().rune_states[id]);
  }

  runeMastery(id: RuneId): number {
    return Math.round(this.profile().rune_states[id].mastery);
  }

  dismissTip(): void {
    this.tipDismissed.set(true);
  }

  enterArena(): void {
    this.profileStore.pruneExpiredBuffs();
    const profile = this.profileStore.profile();
    const raid = this.isComebackEligible()
      ? this.raidBuilder.buildComebackRaid(profile)
      : this.raidBuilder.buildFullRaid(profile);
    this.raidSession.start(raid);
    this.router.navigateByUrl('/arena');
  }

  quickEmber(): void {
    this.profileStore.pruneExpiredBuffs();
    const raid = this.raidBuilder.buildEmberRaid(this.profileStore.profile());
    this.raidSession.start(raid);
    this.router.navigateByUrl('/arena');
  }
}
