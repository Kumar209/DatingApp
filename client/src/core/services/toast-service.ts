import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

type ToastType = 'success' | 'error' | 'warning' | 'info';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private router = inject(Router);

  constructor() {
    this.createToastContainer();
  }

  private createToastContainer() {
    if (document.getElementById('velentra-toast-container')) return;

    const container = document.createElement('div');
    container.id = 'velentra-toast-container';

    container.className = `
      fixed
      bottom-2
      left-1/2
      z-[9999]
      flex
      w-[calc(100vw-0.75rem)]
      max-w-[420px]
      -translate-x-1/2
      flex-col
      gap-2
      sm:bottom-5
      sm:w-[calc(100vw-2rem)]
      lg:left-auto
      lg:right-4
      lg:w-auto
      lg:max-w-none
      lg:translate-x-0
      lg:gap-3
    `;

    document.body.appendChild(container);
  }

  private getConfig(type: ToastType) {
    switch (type) {
      case 'success':
        return {
          alertClass: 'alert-success',
          icon: '✓'
        };

      case 'error':
        return {
          alertClass: 'alert-error',
          icon: '✕'
        };

      case 'warning':
        return {
          alertClass: 'alert-warning',
          icon: '!'
        };

      default:
        return {
          alertClass: 'alert-info',
          icon: 'i'
        };
    }
  }

  private show(
    type: ToastType,
    message: string,
    duration = 4000,
    avatar?: string,
    route?: string
  ) {
    const container = document.getElementById('velentra-toast-container');
    if (!container) return;

    const config = this.getConfig(type);

    const toast = document.createElement('div');

    toast.className = `
      alert
      ${config.alertClass}
      shadow-xl
      rounded-xl
      border
      border-base-300
      backdrop-blur-xl
      w-full
      cursor-pointer
      transition-all
      duration-300
      px-2
      py-2
      min-h-[56px]

      lg:min-w-[320px]
      lg:max-w-sm
      lg:rounded-2xl
      lg:px-4
      lg:py-3
      lg:min-h-[76px]
      lg:shadow-2xl
    `;

    toast.innerHTML = `
      <div class="flex w-full items-center gap-2 lg:gap-3">
        ${
          avatar
            ? `
          <div class="avatar shrink-0">
            <div class="w-8 lg:w-10 rounded-full ring ring-base-300 ring-offset-1 lg:ring-offset-2 ring-offset-base-100">
              <img src="${avatar}" alt="avatar" />
            </div>
          </div>
        `
            : `
          <div class="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-full bg-base-100/70 text-xs lg:text-sm font-medium">
            ${config.icon}
          </div>
        `
        }

        <div class="min-w-0 flex-1">
          <p class="break-words text-xs lg:text-sm font-medium lg:font-semibold leading-snug">
            ${message}
          </p>
        </div>

        <button
          class="toast-close btn btn-ghost btn-circle btn-xs shrink-0 ml-auto h-6 w-6 min-h-0 lg:h-8 lg:w-8"
          type="button"
        >
          ✕
        </button>
      </div>
    `;

    if (route) {
      toast.addEventListener('click', () => {
        this.router.navigateByUrl(route);
        this.removeToast(toast);
      });
    }

    toast.querySelector('.toast-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeToast(toast);
    });

    container.appendChild(toast);

    setTimeout(() => {
      this.removeToast(toast);
    }, duration);
  }

  private removeToast(toast: HTMLElement) {
    toast.classList.add('opacity-0', 'translate-y-3');

    setTimeout(() => {
      toast.remove();
    }, 250);
  }

  success(message: string, duration?: number, avatar?: string, route?: string) {
    this.show('success', message, duration, avatar, route);
  }

  error(message: string, duration?: number, avatar?: string, route?: string) {
    this.show('error', message, duration, avatar, route);
  }

  warning(message: string, duration?: number, avatar?: string, route?: string) {
    this.show('warning', message, duration, avatar, route);
  }

  info(message: string, duration?: number, avatar?: string, route?: string) {
    this.show('info', message, duration, avatar, route);
  }
}