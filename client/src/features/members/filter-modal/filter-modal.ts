import { Component, computed, ElementRef, input, model, output, ViewChild } from '@angular/core';
import { MemberParams } from '../../../types/member';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter-modal',
  imports: [FormsModule],
  templateUrl: './filter-modal.html',
  styleUrl: './filter-modal.css'
})
export class FilterModal {
  @ViewChild('filterModal') modalRef!: ElementRef<HTMLDialogElement>;
  closeModal = output();
  submitData = output<MemberParams>();
  memberParams = model(new MemberParams())

  constructor() {
    const filters = localStorage.getItem('filters');
    if (filters) {
      this.memberParams.set(JSON.parse(filters));
    }
  }

  filterSummary = computed(() => {
    const gender = this.memberParams().gender || 'All genders';

    return `${gender} • Age ${this.memberParams().minAge}-${this.memberParams().maxAge} • ${
      this.memberParams().orderBy === 'lastActive'
        ? 'Recently active'
        : 'Newest members'
    }`;
  });

  open() {
    this.modalRef.nativeElement.showModal();
  }

  close() {
    this.modalRef.nativeElement.close();
    this.closeModal.emit();
  }

  submit() {
    this.submitData.emit(this.memberParams());
    this.close();
  }

  setGender(gender: string) {
    this.memberParams().gender = gender;
  }

  clearGender() {
    this.memberParams().gender = '';
  }

  resetFilters() {
    this.memberParams.set(new MemberParams());
  }

  // onMinAgeChange() {
  //   if (this.memberParams().minAge < 18) this.memberParams().minAge = 18;
  // }

  onMinAgeChange() {
    if (this.memberParams().minAge < 18) {
      this.memberParams().minAge = 18;
    }

    if (this.memberParams().maxAge < this.memberParams().minAge) {
      this.memberParams().maxAge = this.memberParams().minAge;
    }
  }

  onMaxAgeChange() {
    if (this.memberParams().maxAge < this.memberParams().minAge) {
      this.memberParams().maxAge = this.memberParams().minAge
    }
  }
}