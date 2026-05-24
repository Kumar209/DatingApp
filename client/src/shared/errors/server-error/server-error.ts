import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiError } from '../../../types/error';

@Component({
  selector: 'app-server-error',
  imports: [],
  templateUrl: './server-error.html',
  styleUrl: './server-error.css'
})
export class ServerError {
  private router = inject(Router);

  protected showDetails = false;

  protected error: ApiError = {
    message: 'Unexpected server error',
    statusCode: 500
  };

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    const navError = navigation?.extras?.state?.['error'];

    if (navError) {
      this.error = navError;
    }
  }

  detailsToggle() {
    this.showDetails = !this.showDetails;
  }

  goHome() {
    this.router.navigateByUrl('/');
  }
}