import { Component, HostListener, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { EditableMember, Member } from '../../../types/member';
import { DatePipe } from '@angular/common';
import { MemberService } from '../../../core/services/member-service';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastService } from '../../../core/services/toast-service';
import { AccountService } from '../../../core/services/account-service';
import { TimeAgoPipe } from '../../../core/pipes/time-ago-pipe';

@Component({
  selector: 'app-member-profile',
  imports: [DatePipe, FormsModule, TimeAgoPipe],
  templateUrl: './member-profile.html',
  styleUrl: './member-profile.css'
})
export class MemberProfile implements OnInit, OnDestroy {
  @ViewChild('editForm') editForm?: NgForm;

  @HostListener('window:beforeunload', ['$event']) notify($event: BeforeUnloadEvent) {
    if (this.editForm?.dirty) {
      $event.preventDefault();
    }
  }
  private accountService = inject(AccountService);
  protected memberService = inject(MemberService);
  private toast = inject(ToastService);

  protected editableMember: EditableMember = {
    displayName: '',
    description: '',
    city: '',
    country: ''
  }

  ngOnInit(): void {
    //If user trying to edit his/her profile then current user and current member will be same
    const member = this.memberService.member();

    if (!member) return;

    this.editableMember = {
      displayName: this.memberService.member()?.displayName || '',
      description: this.memberService.member()?.description || '',
      city: this.memberService.member()?.city || '',
      country: this.memberService.member()?.country || '',
    }
  }

  updateProfile() {
    const currentMember = this.memberService.member();

    if (!currentMember) return;

    const updatedMember = { 
      ...currentMember, 
      ...this.editableMember 
    }

   
    this.memberService.updateMember(this.editableMember).subscribe({
      next: () => {
        const currentUser = this.accountService.currentUser();

        if (currentUser && updatedMember.displayName !== currentUser?.displayName) {
          // currentUser.displayName = updatedMember.displayName;
          // this.accountService.setCurrentUser(currentUser);

          this.accountService.setCurrentUser({
            ...currentUser,
            displayName: updatedMember.displayName
          });
        }

        this.toast.success('Profile updated successfully');

        this.memberService.member.set(updatedMember as Member);
        // this.memberService.editMode.set(false);
        
        // this.editForm?.reset(updatedMember);

        this.editForm?.resetForm(this.editableMember);
        this.memberService.editMode.set(false);
      }
    })

  }

  ngOnDestroy(): void {
    if (this.memberService.editMode()) {
      this.memberService.editMode.set(false);
    }
  }
}