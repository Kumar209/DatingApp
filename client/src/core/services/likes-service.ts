import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PaginatedResult } from '../../types/pagination';
import { Member } from '../../types/member';
import { ToastService } from './toast-service';

@Injectable({
  providedIn: 'root',
})
export class LikesService {
  private baseUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  likeIds  = signal<string[]>([]); 

  // Sends request to backend to like/unlike a member.
  // Also immediately updates local UI state (signal) so the heart/like button
  // changes instantly without waiting for a full refresh.
  toggleLike(targetMemberId: string) {
    return this.http.post(`${this.baseUrl}likes/${targetMemberId}`, {}).subscribe({
      next: () => {
        const alreadyLiked = this.likeIds().includes(targetMemberId);

        if (alreadyLiked) {
          this.likeIds.update(ids =>
            ids.filter(x => x !== targetMemberId)
          );

          this.toast.info('Removed from likes');
        }
        else {
          this.likeIds.update(ids => [
            ...ids,
            targetMemberId
          ]);

          this.toast.success('Added to likes');
        }
      },
      error: () => {
        this.toast.error('Failed to update like');
      }
    })
  }

  // Fetches paginated members based on like relationship type.
  // predicate values:
  // "liked"   -> members current user liked
  // "likedBy" -> members who liked current user
  // "mutual"  -> members who liked each other (matches)
  getLikes(predicate: string, pageNumber: number, pageSize: number) {
    let params = new HttpParams();

    params = params.append('pageNumber', pageNumber);
    params = params.append('pageSize', pageSize);
    params = params.append('predicate', predicate);

    return this.http.get<PaginatedResult<Member>>(this.baseUrl + 'likes', {params});
  }

  // Loads all member IDs liked by the current logged-in user
  // and stores them in the signal for quick UI access.
  // Useful for showing pre-selected like buttons.
  getLikeIds() {
    return this.http.get<string[]>(this.baseUrl + 'likes/list').subscribe({
      next: ids => this.likeIds.set(ids)
    })
  }

  // Clears locally stored liked member IDs.
  // Usually called on logout so old user's like state doesn't remain in memory.
  clearLikeIds() {
    this.likeIds.set([]);
  }
}
