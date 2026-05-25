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
      next: photos => this.photos.set(photos)
    });
  }

  showUploadMode() {
    this.uploadMode.set(true);
  }

  hideUploadMode() {
    this.uploadMode.set(false);
  }

  onUploadImage(file: File) {
    this.loading.set(true);

    this.memberService.uploadPhoto(file).subscribe({
      next: photo => {
        this.photos.update(photos => [photo, ...photos]);

        if (!this.memberService.member()?.imageUrl) {
          this.setMainLocalPhoto(photo);
        }

        this.loading.set(false);
        this.uploadMode.set(false);
      },
      error: error => {
        console.error('Upload failed:', error);
        this.loading.set(false);
      }
    });
  }

  setMainPhoto(photo: Photo) {
    if (!photo.isApproved) return;

    this.memberService.setMainPhoto(photo).subscribe({
      next: () => {
        this.setMainLocalPhoto(photo);
      }
    });
  }

  deletePhoto(photoId: number) {
    this.memberService.deletePhoto(photoId).subscribe({
      next: () => {
        this.photos.update(photos => photos.filter(x => x.id !== photoId));
      }
    });
  }

  private setMainLocalPhoto(photo: Photo) {
    const currentUser = this.accountService.currentUser();

    if (currentUser) {
      currentUser.imageUrl = photo.url;
      this.accountService.setCurrentUser(currentUser as User);
    }

    this.memberService.member.update(member => ({
      ...member,
      imageUrl: photo.url
    }) as Member);
  }
}


// import { Component, computed, inject, OnInit, signal } from '@angular/core';
// import { MemberService } from '../../../core/services/member-service';
// import { ActivatedRoute } from '@angular/router';
// import { Member, Photo } from '../../../types/member';
// import { ImageUpload } from "../../../shared/image-upload/image-upload";
// import { AccountService } from '../../../core/services/account-service';
// import { User } from '../../../types/user';
// import { StarButton } from "../../../shared/star-button/star-button";
// import { DeleteButton } from "../../../shared/delete-button/delete-button";

// @Component({
//   selector: 'app-member-photos',
//   imports: [ImageUpload, StarButton, DeleteButton],
//   templateUrl: './member-photos.html',
//   styleUrl: './member-photos.css'
// })
// export class MemberPhotos implements OnInit {
//   protected memberService = inject(MemberService);
//   protected accountService = inject(AccountService);

//   private route = inject(ActivatedRoute);
//   protected photos = signal<Photo[]>([]);
//   protected loading = signal(false);

//   protected isOwner = false;

//   protected approvedPhotoCount = computed(() =>
//     this.photos().filter(photo => photo.isApproved).length
//   );


//   ngOnInit(): void {
//     const memberId = this.route.parent?.snapshot.paramMap.get('id');

//     if (!memberId) return;

//     this.isOwner = this.accountService.currentUser()?.id === memberId;

//     if (memberId) {
//       this.memberService.getMemberPhotos(memberId).subscribe({
//         next: photos => this.photos.set(photos)
//       });
//     }
//   }

//   onUploadImage(file: File) {
//     this.loading.set(true);

//     this.memberService.uploadPhoto(file).subscribe({
//       next: photo => {
//         this.photos.update(photos => [...photos, photo]);

//         if (!this.memberService.member()?.imageUrl) {
//           this.setMainLocalPhoto(photo);
//         }

//         this.memberService.editMode.set(false);
//         this.loading.set(false);
//       },
//       error: error => {
//         console.log('Error uploading image: ', error);
//         this.loading.set(false);
//       }
//     })
//   }

//   setMainPhoto(photo: Photo) {
//     if (!photo.isApproved) return;

//     this.memberService.setMainPhoto(photo).subscribe({
//       next: () => {
//         this.setMainLocalPhoto(photo)
//       }
//     })
//   }

//   deletePhoto(photoId: number) {
//     this.memberService.deletePhoto(photoId).subscribe({
//       next: () => {
//         this.photos.update(photos => photos.filter(x => x.id !== photoId))
//       }
//     })
//   }

//   private setMainLocalPhoto(photo: Photo) {
//     const currentUser = this.accountService.currentUser();

//     if (currentUser) currentUser.imageUrl = photo.url;
//     this.accountService.setCurrentUser(currentUser as User);
    
//     this.memberService.member.update(member => ({
//       ...member,
//       imageUrl: photo.url
//     }) as Member)
//   }
// }