import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ManagedUserParams, User } from '../../types/user';
import { Photo } from '../../types/member';
import { PaginatedResult } from '../../types/pagination';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  baseUrl = environment.apiUrl;
  private http = inject(HttpClient);

  // getUserWithRoles() {
  //   return this.http.get<User[]>(this.baseUrl + 'admin/users-with-roles');
  // }

  getUserWithRoles(managedUserParams: ManagedUserParams){
    let params = new HttpParams();

    params = params.append('pageNumber', managedUserParams.pageNumber);
    params = params.append('pageSize', managedUserParams.pageSize);
    params = params.append('role', managedUserParams.role ?? '');
    params = params.append('orderBy', managedUserParams.orderBy);

    return this.http.get<PaginatedResult<User>>(this.baseUrl + 'admin/users-with-roles', {params}).pipe(
      tap(() => {
        localStorage.setItem('managed-filter', JSON.stringify(managedUserParams))
      })
    );
  }

  updateUserRoles(userId: string, roles: string[]) {
    return this.http.post<string[]>(this.baseUrl + 'admin/edit-roles/' 
        + userId + '?roles=' + roles, {})
  }

  getPhotosForApproval() {
    return this.http.get<Photo[]>(this.baseUrl + 'admin/photos-to-moderate');
  }

  approvePhoto(photoId: number) {
    return this.http.post(this.baseUrl + 'admin/approve-photo/' + photoId, {});
  }

  rejectPhoto(photoId: number) {
    return this.http.post(this.baseUrl + 'admin/reject-photo/' + photoId, {});
  }
}