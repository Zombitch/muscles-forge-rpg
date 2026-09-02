import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { KITCHEN_THREE_TAPS_FROM_WEEK, WELL_FED_HOURS } from '../../core/constants';
import { RUNES } from '../../core/content/runes.data';
import { Raid, Scheme } from '../../core/models';
import { RaidBuilderService } from '../../core/services/raid-builder.service';
import {
  RaidCompletionService,
  RaidCompletionSummary,
  SlotResult,
} from '../../core/services/raid-completion.service';
import { RaidSessionService } from '../../core/services/raid-session.service';
import { ResolverService } from '../../core/services/resolver.service';
import { ProfileStore } from '../../core/services/profile.store';
import { HonorChoice } from '../../core/services/xp.service';
import { rollLoot } from '../../core/services/loot.util';

type Phase = 'set' | 'rest' | 'honor' | 'chest' | 'food' | 'empty';

interface SchemeAdjustment {
  low: number;
  high: number;
}

function adjustScheme(base: Scheme, current: SchemeAdjustment, factor: number): SchemeAdjustment {
  const scaled = (n: number) => Math.max(1, Math.round(n * factor));
  return { low: scaled(current.low), high: scaled(current.high) };
}

@Component({
  selector: 'app-arena',
  imports: [],
  templateUrl: './arena.html',
  styleUrl: './arena.scss',
})
export class Arena implements OnInit, OnDestroy {
  private readonly raidSession = inject(RaidSessionService);
  private readonly raidBuilder = inject(RaidBuilderService);
  private readonly resolver = inject(ResolverService);
  private readonly completion = inject(RaidCompletionService);
  private readonly profileStore = inject(ProfileStore);
  private readonly router = inject(Router);

  readonly runes = RUNES;
  readonly phase = signal<Phase>('set');
  readonly raid = signal<Raid | null>(null);
  readonly slotIndex = signal(0);
  readonly setIndex = signal(0);
  readonly setsCompleted = signal<number[]>([]);
  readonly honorBySlot = signal<HonorChoice[]>([]);
  readonly tooEasyStreak = signal<number[]>([]);
  readonly adjustments = signal<SchemeAdjustment[]>([]);
  readonly restSecondsLeft = signal(0);
  readonly summary = signal<RaidCompletionSummary | null>(null);
  readonly loot = signal<ReturnType<typeof rollLoot> | null>(null);

  private restTimer?: ReturnType<typeof setInterval>;

  readonly currentSlot = computed(() => {
    const r = this.raid();
    const i = this.slotIndex();
    return r && i < r.slots.length ? r.slots[i] : null;
  });

  readonly currentScheme = computed<SchemeAdjustment | null>(
    () => this.adjustments()[this.slotIndex()] ?? null,
  );

  readonly totalSlots = computed(() => this.raid()?.slots.length ?? 0);

  ngOnInit(): void {
    let raid = this.raidSession.currentRaid();
    if (!raid) {
      // arrived directly (e.g. deep link) — build and start the standard raid
      raid = this.raidBuilder.buildFullRaid(this.profileStore.profile());
      this.raidSession.start(raid);
      raid = this.raidSession.currentRaid();
    }
    if (!raid || raid.slots.length === 0) {
      this.phase.set('empty');
      this.raid.set(raid);
      return;
    }
    this.raid.set(raid);
    this.setsCompleted.set(raid.slots.map(() => 0));
    this.honorBySlot.set(raid.slots.map(() => null));
    this.tooEasyStreak.set(raid.slots.map(() => 0));
    this.adjustments.set(
      raid.slots.map((s) => ({ low: s.cast.default_scheme.low, high: s.cast.default_scheme.high })),
    );
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.restTimer) {
      clearInterval(this.restTimer);
      this.restTimer = undefined;
    }
  }

  schemeLabel(): string {
    const slot = this.currentSlot();
    const adj = this.currentScheme();
    if (!slot || !adj) return '';
    const unit = slot.cast.default_scheme.unit;
    if (slot.cast.default_scheme.kind === 'time') {
      return adj.low === adj.high
        ? `${adj.low}${unit === 's' ? 's' : ' min'}`
        : `${adj.low}-${adj.high}${unit === 's' ? 's' : ' min'}`;
    }
    return adj.low === adj.high ? `${adj.low} reps` : `${adj.low}-${adj.high} reps`;
  }

  done(): void {
    const raid = this.raid();
    const slot = this.currentSlot();
    if (!raid || !slot) return;
    const i = this.slotIndex();
    this.setsCompleted.update((arr) => arr.map((v, idx) => (idx === i ? v + 1 : v)));

    const isLastSetOfSlot = this.setIndex() + 1 >= slot.sets_planned;
    if (isLastSetOfSlot) {
      this.phase.set('honor');
    } else {
      this.startRest();
    }
  }

  private startRest(): void {
    const slot = this.currentSlot();
    if (!slot) return;
    this.phase.set('rest');
    this.restSecondsLeft.set(slot.rest_seconds);
    this.clearTimer();
    this.restTimer = setInterval(() => {
      const remaining = this.restSecondsLeft() - 1;
      if (remaining <= 0) {
        this.clearTimer();
        this.restSecondsLeft.set(0);
        this.advanceSet();
      } else {
        this.restSecondsLeft.set(remaining);
      }
    }, 1000);
  }

  skipRest(): void {
    this.clearTimer();
    this.advanceSet();
  }

  private advanceSet(): void {
    this.setIndex.update((v) => v + 1);
    this.phase.set('set');
  }

  chooseHonor(choice: HonorChoice): void {
    const i = this.slotIndex();
    this.honorBySlot.update((arr) => arr.map((v, idx) => (idx === i ? choice : v)));
    this.advanceSlot();
  }

  private advanceSlot(): void {
    const raid = this.raid();
    if (!raid) return;
    const next = this.slotIndex() + 1;
    if (next >= raid.slots.length) {
      this.finishRaid();
    } else {
      this.slotIndex.set(next);
      this.setIndex.set(0);
      this.phase.set('set');
    }
  }

  tooHard(): void {
    const slot = this.currentSlot();
    const i = this.slotIndex();
    if (!slot) return;
    this.adjustments.update((arr) =>
      arr.map((a, idx) => (idx === i ? adjustScheme(slot.cast.default_scheme, a, 0.8) : a)),
    );
    this.tooEasyStreak.update((arr) => arr.map((v, idx) => (idx === i ? 0 : v)));
  }

  tooEasy(): void {
    const raid = this.raid();
    const slot = this.currentSlot();
    const i = this.slotIndex();
    if (!raid || !slot) return;
    this.adjustments.update((arr) =>
      arr.map((a, idx) => (idx === i ? { low: a.low + 2, high: a.high + 2 } : a)),
    );
    this.tooEasyStreak.update((arr) => arr.map((v, idx) => (idx === i ? v + 1 : v)));
    if (this.tooEasyStreak()[i] >= 2 && slot.load === 'light') {
      this.raid.update((r) => {
        if (!r) return r;
        const slots = r.slots.map((s, idx) => (idx === i ? { ...s, load: 'work' as const } : s));
        return { ...r, slots };
      });
    }
  }

  skipMove(): void {
    const raid = this.raid();
    const slot = this.currentSlot();
    const i = this.slotIndex();
    if (!raid || !slot) return;
    const alt = this.resolver.swapCast(slot.rune_id, this.profileStore.profile(), slot.cast.id);
    if (!alt) return;
    this.raid.update((r) => {
      if (!r) return r;
      const slots = r.slots.map((s, idx) => (idx === i ? { ...s, cast: alt } : s));
      return { ...r, slots };
    });
    this.adjustments.update((arr) =>
      arr.map((a, idx) =>
        idx === i ? { low: alt.default_scheme.low, high: alt.default_scheme.high } : a,
      ),
    );
    this.setIndex.set(0);
    this.setsCompleted.update((arr) => arr.map((v, idx) => (idx === i ? 0 : v)));
  }

  private finishRaid(): void {
    const raid = this.raid();
    if (!raid) return;
    const results: SlotResult[] = raid.slots.map((s, idx) => ({
      rune_id: s.rune_id,
      sets_completed: this.setsCompleted()[idx] ?? 0,
      honor: this.honorBySlot()[idx] ?? null,
    }));
    const summary = this.completion.complete(raid, results);
    this.summary.set(summary);

    if (raid.type === 'full' || raid.type === 'comeback') {
      const profile = this.profileStore.profile();
      const result = rollLoot(profile.raids_since_shard, false, false);
      this.profileStore.recordLootRoll(result.shard);
      this.loot.set(result);
    }

    this.phase.set('chest');
  }

  proceedFromChest(): void {
    const raid = this.raid();
    const profile = this.profileStore.profile();
    const seasonWeek = Math.max(
      1,
      Math.floor((Date.now() - profile.install_at) / 86400000 / 7) + 1,
    );
    const kitchenUnlocked = seasonWeek >= KITCHEN_THREE_TAPS_FROM_WEEK;
    if (raid && (raid.type === 'full' || raid.type === 'comeback') && kitchenUnlocked) {
      this.phase.set('food');
    } else {
      this.goHome();
    }
  }

  chooseFood(kind: 'protein' | 'plate' | 'skip'): void {
    if (kind !== 'skip') {
      this.profileStore.addBuff({
        id: 'well_fed_simple',
        expires_at: Date.now() + WELL_FED_HOURS * 3600_000,
      });
    }
    this.goHome();
  }

  goHome(): void {
    this.raidSession.clear();
    this.router.navigateByUrl('/');
  }
}
