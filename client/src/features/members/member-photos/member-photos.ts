import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MemberService } from '../../../core/services/member-service';
import { ActivatedRoute } from '@angular/router';
import { Member, Photo } from '../../../types/member';
import { ImageUpload } from '../../../shared/image-upload/image-upload';
import { AccountService } from '../../../core/services/account-service';
import { User } from '../../../types/user';
import { StarButton } from '../../../shared/star-button/star-button';
import { DeleteButton } from '../../../shared/delete-button/delete-button';
import { DatePipe } from '@angular/common';
import { ToastService } from '../../../core/services/toast-service';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-member-photos',
  imports: [ImageUpload, StarButton, DeleteButton, DatePipe],
  templateUrl: './member-photos.html',
  styleUrl: './member-photos.css'
})
export class MemberPhotos implements OnInit {
  protected memberService = inject(MemberService);
  protected accountService = inject(AccountService);

  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  
  protected photos = signal<Photo[]>([]);
  protected loading = signal(false);
  protected uploadMode = signal(false);
  protected isOwner = false;

  protected approvedPhotoCount = computed(() =>
    this.photos().filter(photo => photo.isApproved).length
  );

  ngOnInit(): void {
    const memberId = this.route.parent?.snapshot.paramMap.get('id');
    if (!memberId) return;

    this.isOwner = this.accountService.currentUser()?.id === memberId;

    this.memberService.getMemberPhotos(memberId).subscribe({
      next: photos => {
        this.photos.set(photos);
      },
      error: () => {
        this.toast.error('Failed to load photos');
      }
    });
  }

  showUploadMode() {
    this.uploadMode.set(true);
  }

  hideUploadMode() {
    this.uploadMode.set(false);
  }

  onUploadImage(file: File) {
    if (this.loading()) return;
    this.loading.set(true);
    

    this.memberService.uploadPhoto(file)
    .pipe(
        finalize(() => this.loading.set(false))
      )
    .subscribe({
      next: photo => {
        this.photos.update(photos => [photo, ...photos]);

        // first uploaded photo becomes main
        if (!this.memberService.member()?.imageUrl) {
          this.setMainLocalPhoto(photo);
        }

        this.toast.success('Photo uploaded successfully');
        this.uploadMode.set(false);
      },
      error: error => {
          const message =
            error.error || 'Failed to upload photo';

          this.toast.error(message);
      }
    });
  }

  setMainPhoto(photo: Photo) {
    if (!photo.isApproved) return;

    this.memberService.setMainPhoto(photo).subscribe({
      next: () => {
        this.setMainLocalPhoto(photo);
        this.toast.success('Main photo updated');
      },
      error: (error: HttpErrorResponse) => {
        const message =
          error.error || 'Failed to update main photo';

        this.toast.error(message);
      }     
    });
  }

  deletePhoto(photoId: number) {
    if (!confirm('Delete this photo?')) return;

    this.memberService.deletePhoto(photoId).subscribe({
      next: () => {
        this.photos.update(photos => photos.filter(x => x.id !== photoId));
        this.toast.success('Photo deleted');
      },
      error: (error: HttpErrorResponse) => {
        const message =
          error.error || 'Failed to delete photo';

        this.toast.error(message);
      }
    });
  }

  private setMainLocalPhoto(photo: Photo) {
    const currentUser = this.accountService.currentUser();

    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        imageUrl: photo.url
      };

      this.accountService.setCurrentUser(updatedUser);
    }

    // if (currentUser) {
    //   currentUser.imageUrl = photo.url;
    //   this.accountService.setCurrentUser(currentUser as User);
    // }

    // this.memberService.member.update(member => ({
    //   ...member,
    //   imageUrl: photo.url
    // }) as Member);

    this.memberService.member.update(member => {
      if (!member) return null;

      return {
        ...member,
        imageUrl: photo.url
      } as Member;
    });
  }
}

