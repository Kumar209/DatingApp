import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { LoginCreds, RegisterCreds, User } from '../../types/user';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private http = inject(HttpClient);
  // private likesService = inject(LikesService);
  // private presenceService = inject(PresenceService);
  currentUser = signal<User | null>(null);
  /*
private refreshTimer?: ReturnType<typeof setInterval>;
*/
  private baseUrl = environment.apiUrl;

  register(creds: RegisterCreds) {
    return this.http.post<User>(this.baseUrl + 'Account/register', creds, 
      { withCredentials: true }).pipe(
        tap(user => {
          if (user) {
            this.setCurrentUser(user);
            // this.startTokenRefreshInterval();
          }
        })
      )
  }

  login(creds : LoginCreds) {
    return this.http.post<User>(this.baseUrl + 'Account/login', creds,
      { withCredentials: true }).pipe(
        tap(user => {
          if (user) {
            this.setCurrentUser(user);
            // this.startTokenRefreshInterval();
          }
        })
      )
  }

  setCurrentUser(user: User) {
    // user.roles = this.getRolesFromToken(user);
    
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', user.token);

    this.currentUser.set(user);

    // this.likesService.getLikeIds();

    // if (this.presenceService.hubConnection?.state !== HubConnectionState.Connected) {
    //   this.presenceService.createHubConnection(user)
    // }
  }

  loadCurrentUser() {
    const userJson = localStorage.getItem('user');

    if (!userJson) return;

    const user = JSON.parse(userJson) as User;
    this.currentUser.set(user);
  }

  logout() {
      /*
  this.stopTokenRefreshInterval();
  */
 
    localStorage.removeItem('user');
    localStorage.removeItem('token');

    this.currentUser.set(null);
  }

    /*
  refreshToken() {
    return this.http.post<User>(
      this.baseUrl + 'Account/refresh-token',
      {},
      { withCredentials: true }
    );
  }
  */



  /*
startTokenRefreshInterval() {
  this.stopTokenRefreshInterval();

  this.refreshTimer = setInterval(() => {
    this.refreshToken().subscribe({
      next: user => this.setCurrentUser(user),
      error: () => this.logout()
    });
  }, 14 * 24 * 60 * 60 * 1000);
}

stopTokenRefreshInterval() {
  if (this.refreshTimer) {
    clearInterval(this.refreshTimer);
    this.refreshTimer = undefined;
  }
}
*/

}
