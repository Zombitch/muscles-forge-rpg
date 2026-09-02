import { Injectable, signal } from '@angular/core';
import { Raid } from '../models';

/** Holds the raid currently offered/in-progress so Arena can pick it up after navigation. */
@Injectable({ providedIn: 'root' })
export class RaidSessionService {
  private readonly _currentRaid = signal<Raid | null>(null);
  readonly currentRaid = this._currentRaid.asReadonly();

  start(raid: Raid): void {
    this._currentRaid.set({ ...raid, status: 'in_progress', started_at: Date.now() });
  }

  clear(): void {
    this._currentRaid.set(null);
  }
}
