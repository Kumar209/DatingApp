import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink, Router } from '@angular/router';
import { AccountService } from '../../../core/services/account-service';
import { LoginCreds } from '../../../types/user';
import { ToastService } from '../../../core/services/toast-service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private accountService = inject(AccountService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private toast = inject(ToastService);
  

  protected isPending = signal(false);
   protected showPassword = signal(false);

  protected loginForm = this.fb.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email
      ]
    ],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(6)
      ]
    ]
  });

  togglePasswordVisibility() {
    this.showPassword.update(value => !value);
  }

  login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isPending.set(true);
 
    const { email, password } = this.loginForm.getRawValue();

    const loginCreds: LoginCreds = {
      email: email!,
      password: password!
    };

    this.accountService.login(loginCreds).subscribe({
      next: (response) => {

        this.isPending.set(false);
        this.toast.success( `Welcome back, ${response.displayName || 'User'} ✨`, 3000 );

        this.router.navigateByUrl('/');
      },

      error: (error) => {
        let message = 'Something went wrong';

          if (error.status === 0) {
            message = 'Cannot connect to server. Please try again later.';
          } else if (typeof error.error === 'string') {
            message = error.error;
          } else if (error?.error?.message) {
            message = error.error.message;
          }

          this.toast.error(message);
          this.isPending.set(false);
      }
    });
  }
}