import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { RegisterCreds } from '../../../types/user';
import { AccountService } from '../../../core/services/account-service';
import { ToastService } from '../../../core/services/toast-service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!confirmPassword) {
    return null;
  }

  return password === confirmPassword
    ? null
    : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private accountService = inject(AccountService);
  private toast = inject(ToastService);

  protected currentStep = signal(1);
  protected isPending = signal(false);

  protected showPassword = signal(false);
  protected showConfirmPassword = signal(false);

  protected credentialsForm = this.fb.group(
    {
      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],
      displayName: [
        '',
        [
          Validators.required,
          Validators.minLength(2)
        ]
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(4)
        ]
      ],
      confirmPassword: [
        '',
        [
          Validators.required
        ]
      ]
    },
    {
      validators: passwordMatchValidator
    }
  );

  protected profileForm = this.fb.group({
    gender: [
      '',
      Validators.required
    ],
    dateOfBirth: [
      '',
      Validators.required
    ],
    city: [
      '',
      Validators.required
    ],
    country: [
      '',
      Validators.required
    ]
  });

  togglePasswordVisibility() {
    this.showPassword.update(value => !value);
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.update(value => !value);
  }

  nextStep() {
    this.credentialsForm.markAllAsTouched();

    if (this.credentialsForm.invalid) {
      return;
    }

    this.currentStep.set(2);
  }

  prevStep() {
    this.currentStep.set(1);
  }

  getMaxDate(): string {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 18);
    return today.toISOString().split('T')[0];
  }

  register() {
    this.profileForm.markAllAsTouched();

    if (this.credentialsForm.invalid) {
      this.currentStep.set(1);
      this.credentialsForm.markAllAsTouched();
      return;
    }

    if (this.profileForm.invalid) {
      return;
    }

    this.isPending.set(true);

    const credentials = this.credentialsForm.getRawValue();
    const profile = this.profileForm.getRawValue();

    const payload: RegisterCreds = {
      displayName: credentials.displayName!,
      email: credentials.email!,
      password: credentials.password!,
      // gender: profile.gender!,
      // city: profile.city!,
      // country: profile.country!,
      // dateOfBirth: profile.dateOfBirth!
    };

    this.accountService.register(payload)
      .subscribe({
        next: () => {
           this.isPending.set(false);
            this.toast.success(
              'Welcome to Velentra! Account created successfully.',
              4000
            );
           this.router.navigateByUrl('/');
        },
        error: (error) => {
            if (error.status === 0) {
              this.toast.error('Unable to connect to server. Please try again later.', 5000);
            }

            else if (typeof error?.error === 'string') {
              this.toast.error(error.error, 4000);
            }
            
            else if (error?.error?.errors) {
              const apiErrors = Object.values(error.error.errors)
                .flat()
                .join(', ');

              this.toast.error(apiErrors, 5000);
            }

            else {
              this.toast.error('Registration failed', 4000);
            }

          this.isPending.set(false);
        }
      });
  }
}