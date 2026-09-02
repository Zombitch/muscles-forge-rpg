import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { S1_WEEKS } from '../../core/constants';
import {
  ALL_JOINT_FLAGS,
  ALL_TOOL_IDS,
  JointFlag,
  Place,
  TimeBoxMin,
  ToolId,
} from '../../core/models';
import { ProfileStore } from '../../core/services/profile.store';

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
  selector: 'app-book',
  imports: [DatePipe],
  templateUrl: './book.html',
  styleUrl: './book.scss',
})
export class Book {
  private readonly profileStore = inject(ProfileStore);

  readonly profile = this.profileStore.profile;
  readonly seasonWeek = this.profileStore.seasonWeek;
  readonly s1Weeks = S1_WEEKS;
  readonly toolIds = ALL_TOOL_IDS;
  readonly toolLabels = TOOL_LABELS;
  readonly jointFlagIds = ALL_JOINT_FLAGS;
  readonly jointLabels = JOINT_LABELS;
  readonly placeOptions: Place[] = ['home', 'gym', 'both'];
  readonly timeBoxOptions: TimeBoxMin[] = [15, 25, 40];

  setPlace(p: Place): void {
    this.profileStore.updateSettings({ place: p });
  }

  setTimeBox(t: TimeBoxMin): void {
    this.profileStore.updateSettings({ time_box_min: t });
  }

  toggleTool(tool: ToolId): void {
    const current = this.profile().tools;
    const next = current.includes(tool) ? current.filter((t) => t !== tool) : [...current, tool];
    if (next.length > 0) this.profileStore.updateSettings({ tools: next });
  }

  toggleJointFlag(flag: JointFlag): void {
    const current = this.profile().joint_flags;
    let next: JointFlag[];
    if (flag === 'none') {
      next = ['none'];
    } else {
      const withoutNone = current.filter((f) => f !== 'none');
      next = withoutNone.includes(flag)
        ? withoutNone.filter((f) => f !== flag)
        : [...withoutNone, flag];
    }
    if (next.length > 0) this.profileStore.updateSettings({ joint_flags: next });
  }

  updateHeroName(name: string): void {
    this.profileStore.updateSettings({ hero_name: name });
  }

  get illnessActive(): boolean {
    const until = this.profile().illness_until;
    return !!until && until > Date.now();
  }

  setIllness(days: number): void {
    this.profileStore.setIllnessUntil(Date.now() + days * 86400_000);
  }

  clearIllness(): void {
    this.profileStore.setIllnessUntil(undefined);
  }
}
