import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin.html',
})
export class Admin {
  protected sidebarOpen = signal(true);

  toggleSidebar() {
    this.sidebarOpen.update(value => !value);
  }
}
