import { inject, Injectable } from '@angular/core';
import { AccountService } from './account-service';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InitService {
  private accountService = inject(AccountService);

  init() {
    this.accountService.loadCurrentUser();

    return of(true);

  
    // // FUTURE REFRESH TOKEN VERSION:

    // return this.accountService.refreshToken().pipe(
    //   tap(user => {
    //     if (user) {
    //       this.accountService.setCurrentUser(user);
    //       this.accountService.startTokenRefreshInterval();
    //     }
    //   }),
    //   catchError(() => {
    //     this.accountService.logoutLocalOnly(); // only use it if you have a separate logout method that doesn't call the API
    //     return of(null);
    //   })
    // );
  
  }
}