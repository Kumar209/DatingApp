import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Nav } from "../layout/nav/nav";
import { Router, RouterOutlet } from '@angular/router';
import { AccountService } from '../core/services/account-service';
import { Loading } from '../shared/loading/loading';
import { ConfirmDialog } from '../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-root',
  imports: [Nav, RouterOutlet, Loading, ConfirmDialog],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected router = inject(Router);

  protected readonly title = signal('Valentra');

  protected hideNavRoutes = ['/auth/login', '/auth/register'];

  protected get showNav(): boolean {
    return !this.hideNavRoutes.includes(this.router.url);
  }

}
