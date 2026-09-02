import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ProfileStore } from '../services/profile.store';

export const requireOnboarded: CanActivateFn = () => {
  const profileStore = inject(ProfileStore);
  const router = inject(Router);
  if (profileStore.profile().onboarded) return true;
  return router.parseUrl('/onboarding');
};

export const redirectIfOnboarded: CanActivateFn = () => {
  const profileStore = inject(ProfileStore);
  const router = inject(Router);
  if (!profileStore.profile().onboarded) return true;
  return router.parseUrl('/');
};
