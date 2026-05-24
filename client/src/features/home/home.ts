import { Component, inject, signal } from '@angular/core';
import { AccountService } from '../../core/services/account-service';
import { Register } from '../account/register/register';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  protected accountService = inject(AccountService);
  protected registerMode = signal(false);
}