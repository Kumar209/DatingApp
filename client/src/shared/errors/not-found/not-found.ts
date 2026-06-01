import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css'
})
export class NotFound {
  private location = inject(Location);

  goBack() {
    this.location.back();
  }
}