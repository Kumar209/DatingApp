import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Nav } from "../layout/nav/nav";
import { Router, RouterOutlet } from '@angular/router';
import { AccountService } from '../core/services/account-service';

@Component({
  selector: 'app-root',
  imports: [Nav, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private http = inject(HttpClient);
  protected router = inject(Router);
  private accountService = inject(AccountService);

  protected readonly title = signal('Valentra');

  protected members = signal<Member[]>([]);

  protected hideNavRoutes = ['/auth/login', '/auth/register'];

  protected get showNav(): boolean {
    return !this.hideNavRoutes.includes(this.router.url);
  }

  ngOnInit(): void {
    this.getMembers();
    this.accountService.loadCurrentUser();
  }

  async getMembers(){
    await this.http.get<Member[]>("https://localhost:7174/api/Members/getmembers").subscribe({
      next: (response) => {
        this.members.set(response);
      },
      error: (error) => console.log(error),
      complete: () => console.log("Request completed")
    })
  }

}
