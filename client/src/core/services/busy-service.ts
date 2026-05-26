import { computed, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

// This service tracks how many API requests are currently running.

export class BusyService {
  busyRequestCount = signal(0);

  isBusy = computed(() => this.busyRequestCount() > 0);

  busy() {
    this.busyRequestCount.update(current => current + 1);
  }

  idle() {
    this.busyRequestCount.update(current => Math.max(0, current - 1));
  }
}