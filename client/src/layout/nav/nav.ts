import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AccountService } from '../../core/services/account-service';
import { themes } from '../theme';

@Component({
  selector: 'app-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav.html',
})
export class Nav implements OnInit {
  protected accountService = inject(AccountService);
  private router = inject(Router);

  protected selectedTheme = signal<string>(
    localStorage.getItem('theme') || 'light'
  );

  protected themes = themes;
  protected mobileMenuOpen = signal(false);

  protected isLoggedIn = computed(() => !!this.accountService.currentUser());

  protected userDisplayName = computed(() =>
    this.accountService.currentUser()?.displayName || 'User'
  );

  protected userProfileImage = computed(() =>
    this.accountService.currentUser()?.imageUrl || null
  );

  ngOnInit(): void {
    document.documentElement.setAttribute(
      'data-theme',
      this.selectedTheme()
    );
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update(value => !value);
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  handleSelectTheme(theme: string) {
    this.selectedTheme.set(theme);
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);

    const elem = document.activeElement as HTMLElement;
    elem?.blur();
  }

  userInitials(): string {
    const name = this.userDisplayName().trim();

    if (!name) return 'U';

    const parts = name.split(' ').filter(Boolean);

    if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }

    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  }

  logout() {
    this.accountService.logout();
    this.closeMobileMenu();
    this.router.navigate(['/auth/login']);
  }
}