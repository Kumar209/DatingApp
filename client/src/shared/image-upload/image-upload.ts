import { Component, inject, input, output, signal } from '@angular/core';
import { ToastService } from '../../core/services/toast-service';

@Component({
  selector: 'app-image-upload',
  imports: [],
  templateUrl: './image-upload.html',
  styleUrl: './image-upload.css'
})
export class ImageUpload {
  protected imageSrc = signal<string | ArrayBuffer | null | undefined>(null);
  protected isDragging = false;
  private fileToUpload: File | null = null;
  private toast = inject(ToastService);

  uploadFile = output<File>();
  loading = input<boolean>(false);

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files.length) {
      const file = event.dataTransfer.files[0];
      this.previewImage(file);
      this.fileToUpload = file;
    }
  }

  onCancel() {
    this.fileToUpload = null;
    this.imageSrc.set(null);
  }

  onUploadFile() {
    if (this.fileToUpload) {
      this.uploadFile.emit(this.fileToUpload);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files?.length) {
      const file = input.files[0];
      this.fileToUpload = file;
      this.previewImage(file);
    }
  }

  private previewImage(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => this.imageSrc.set(e.target?.result);
    reader.readAsDataURL(file);
  }
}