import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileStore } from '../../core/services/profile.store';
import { RaidBuilderService } from '../../core/services/raid-builder.service';
import { RaidSessionService } from '../../core/services/raid-session.service';
import {
  ALL_JOINT_FLAGS,
  ALL_TOOL_IDS,
  JointFlag,
  Place,
  TimeBoxMin,
  ToolId,
} from '../../core/models';

const TOOL_LABELS: Record<ToolId, string> = {
  floor: 'Just the floor',
  backpack: 'Backpack',
  bands: 'Bands',
  dumbbells: 'Dumbbells',
  machines: 'Gym machines',
  bar: 'Barbell',
  pullup_bar: 'Pull-up bar',
};

const JOINT_LABELS: Record<JointFlag, string> = {
  knees: 'Knees',
  shoulders: 'Shoulders',
  back: 'Back',
  wrists: 'Wrists',
  none: 'None of these',
};

@Component({
  selector: 'app-onboarding',
  imports: [],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.scss',
})
export class Onboarding {
  private readonly profileStore = inject(ProfileStore);
  private readonly raidBuilder = inject(RaidBuilderService);
  private readonly raidSession = inject(RaidSessionService);
  private readonly router = inject(Router);

  readonly toolIds = ALL_TOOL_IDS;
  readonly toolLabels = TOOL_LABELS;
  readonly jointFlagIds = ALL_JOINT_FLAGS;
  readonly jointLabels = JOINT_LABELS;
  readonly placeOptions: Place[] = ['home', 'gym', 'both'];
  readonly timeBoxOptions: TimeBoxMin[] = [15, 25, 40];

  readonly heroName = signal('');
  readonly place = signal<Place>('home');
  readonly timeBox = signal<TimeBoxMin>(25);
  readonly tools = signal<ToolId[]>(['floor']);
  readonly jointFlags = signal<JointFlag[]>(['none']);

  setPlace(p: Place): void {
    this.place.set(p);
  }

  setTimeBox(t: TimeBoxMin): void {
    this.timeBox.set(t);
  }

  toggleTool(tool: ToolId): void {
    this.tools.update((current) =>
      current.includes(tool) ? current.filter((t) => t !== tool) : [...current, tool],
    );
  }

  toggleJointFlag(flag: JointFlag): void {
    this.jointFlags.update((current) => {
      if (flag === 'none') return ['none'];
      const withoutNone = current.filter((f) => f !== 'none');
      return withoutNone.includes(flag)
        ? withoutNone.filter((f) => f !== flag)
        : [...withoutNone, flag];
    });
  }

  get canBegin(): boolean {
    return this.tools().length > 0 && this.jointFlags().length > 0;
  }

  begin(): void {
    if (!this.canBegin) return;
    this.profileStore.completeOnboarding({
      hero_name: this.heroName().trim() || 'Smith',
      place: this.place(),
      time_box_min: this.timeBox(),
      tools: this.tools(),
      joint_flags: this.jointFlags(),
    });
    const raid = this.raidBuilder.buildFullRaid(this.profileStore.profile());
    this.raidSession.start(raid);
    this.router.navigateByUrl('/arena');
  }
}
