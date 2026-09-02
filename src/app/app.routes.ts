import { Routes } from '@angular/router';
import { redirectIfOnboarded, requireOnboarded } from './core/guards/onboarding.guard';

export const routes: Routes = [
  {
    path: 'onboarding',
    canActivate: [redirectIfOnboarded],
    loadComponent: () => import('./features/onboarding/onboarding').then((m) => m.Onboarding),
  },
  {
    path: '',
    canActivate: [requireOnboarded],
    loadComponent: () => import('./features/forge-home/forge-home').then((m) => m.ForgeHome),
  },
  {
    path: 'arena',
    canActivate: [requireOnboarded],
    loadComponent: () => import('./features/arena/arena').then((m) => m.Arena),
  },
  {
    path: 'kitchen',
    canActivate: [requireOnboarded],
    loadComponent: () => import('./features/kitchen/kitchen').then((m) => m.Kitchen),
  },
  {
    path: 'book',
    canActivate: [requireOnboarded],
    loadComponent: () => import('./features/book/book').then((m) => m.Book),
  },
  { path: '**', redirectTo: '' },
];
