import { Component, inject, signal } from '@angular/core';
import { ManagedPhoto, Photo } from '../../../types/member';
import { AdminService } from '../../../core/services/admin-service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-photo-management',
  imports: [DatePipe],
  templateUrl: './photo-management.html',
  styleUrl: './photo-management.css'
})
export class PhotoManagement {
  photos = signal<ManagedPhoto[]>([]);
  private adminService = inject(AdminService);

  ngOnInit(): void {
    this.getPhotosForApproval();
  }

  getPhotosForApproval() {
    this.adminService.getPhotosForApproval().subscribe({
      next: photos => {
        this.photos.set(photos);
      }
    })
  }

  approvePhoto(photoId: number) {
    this.adminService.approvePhoto(photoId).subscribe({
      next: () => this.photos.update(photos => {
        return photos.filter(x => x.id !== photoId)
      })
    })
  }

  rejectPhoto(photoId: number) {
    this.adminService.rejectPhoto(photoId).subscribe({
      next: () => this.photos.update(photos => {
        return photos.filter(x => x.id !== photoId)
      })
    })
  }
}