import { Component, computed, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly currentUrl = signal('/');
  readonly showNav = computed(() => {
    const url = this.currentUrl();
    return url === '/' || url.startsWith('/kitchen') || url.startsWith('/book');
  });

  constructor(router: Router) {
    this.currentUrl.set(router.url);
    router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      this.currentUrl.set((e as NavigationEnd).urlAfterRedirects);
    });
  }
}
