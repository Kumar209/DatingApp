import { Component, ElementRef, ViewChild, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ManagedUserParams } from '../../../../types/user';

@Component({
  selector: 'app-managed-user-filter-modal',
  imports: [FormsModule],
  templateUrl: './managed-user-filter-modal.html',
})
export class ManagedUserFilterModal {
  @ViewChild('filterModal')
  modalRef!: ElementRef<HTMLDialogElement>;

  params = model(new ManagedUserParams());

  submitData = output<ManagedUserParams>();
  closeModal = output();

  open() {
    this.modalRef.nativeElement.showModal();
  }

  close() {
    this.modalRef.nativeElement.close();
    this.closeModal.emit();
  }

  resetFilters() {
    this.params.set(new ManagedUserParams());
  }

  submit() {
    this.submitData.emit(this.params());
    this.close();
  }
}
