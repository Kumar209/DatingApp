import { HttpEvent, HttpInterceptorFn, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { BusyService } from '../services/busy-service';
import { delay, finalize, identity, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';

type CacheEntry = {
  response: HttpEvent<unknown>;
  timestamp: number;
}

// In-memory response cache
const cache = new Map<string, CacheEntry>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // // Cache lifetime: 5 minutes

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const busyService = inject(BusyService);

  // Create unique cache key including query params
  const generateCacheKey = (url: string, params: HttpParams): string => {
    const paramString = params.keys().map(key => `${key}=${params.get(key)}`).join('&');
    return paramString ? `${url}?${paramString}` : url;
  }

  // Remove stale cache entries after mutations
  const invalidateCache = (urlPattern: string) => {
    for (const key of cache.keys()) {
      if (key.includes(urlPattern)) {
        cache.delete(key);
      }
    }
  }

  const cacheKey = generateCacheKey(req.url, req.params);

  // Invalidate related cache after data changes
  if (req.method.includes('POST') && req.url.includes('/likes')) {
    invalidateCache('/likes')
  }

  if (req.method.includes('POST') && req.url.includes('/messages')) {
    invalidateCache('/messages')
  }

  if (req.method.includes('POST') && req.url.includes('/add-photo')) {
    invalidateCache('/photos')
  }

   // Clear all cache on logout
  if (req.method.includes('POST') && req.url.includes('/logout')) {
    cache.clear();
  }

  // Serve cached GET response if valid
  if (req.method === 'GET') {
    const cachedResponse = cache.get(cacheKey);

    if (cachedResponse) {
      const isExpired = (Date.now() - cachedResponse.timestamp) > CACHE_DURATION_MS;
      if (!isExpired) {
        return of(cachedResponse.response);
      } else {
        cache.delete(cacheKey);
      }
    }
  }

  // Start global loader
  busyService.busy();

  return next(req).pipe(
    // Send request to the next interceptor / actual backend API
    // In development, artificially delay response by 500ms
    // so loading spinner is visible and easier to test.
    // In production, do nothing (identity = pass through unchanged)
    (environment.production ? identity : delay(500)),

    tap(response => {
      // Store successful response in in-memory cache
      cache.set(cacheKey, {
        response,
        timestamp: Date.now()
      })
    }),

     // Always stop loader
    finalize(() => {
      busyService.idle()
    })
  )
};