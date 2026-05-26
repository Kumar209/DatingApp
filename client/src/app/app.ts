import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Nav } from "../layout/nav/nav";
import { Router, RouterOutlet } from '@angular/router';
import { AccountService } from '../core/services/account-service';
import { Loading } from '../shared/loading/loading';

@Component({
  selector: 'app-root',
  imports: [Nav, RouterOutlet, Loading],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private http = inject(HttpClient);
  protected router = inject(Router);
  private accountService = inject(AccountService);

  protected readonly title = signal('Valentra');

  protected hideNavRoutes = ['/auth/login', '/auth/register'];

  protected get showNav(): boolean {
    return !this.hideNavRoutes.includes(this.router.url);
  }

  ngOnInit(): void {
    this.accountService.loadCurrentUser();
  }

}
