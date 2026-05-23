import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink, Router } from '@angular/router';
import { AccountService } from '../../../core/services/account-service';
import { LoginCreds } from '../../../types/user';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private accountService = inject(AccountService);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  protected isPending = signal(false);
  protected errorMessage = signal('');
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
    this.errorMessage.set('');
 
    const { email, password } = this.loginForm.getRawValue();

    const loginCreds: LoginCreds = {
      email: email!,
      password: password!
    };

    this.accountService.login(loginCreds).subscribe({
      next: (response) => {
        console.log('Login success:', response);

        this.isPending.set(false);
        this.router.navigateByUrl('/');
      },

      error: (error) => {
        console.log(error)

        this.errorMessage.set(
          error?.error || 'Login failed'
        );

        this.isPending.set(false);
      }
    });
  }
}