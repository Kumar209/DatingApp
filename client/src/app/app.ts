import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Nav } from "../layout/nav/nav";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [Nav, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private http = inject(HttpClient);
  protected readonly title = signal('Dating App');

  protected members = signal<Member[]>([]);

  ngOnInit(): void {
    console.log(1);
    this.getMembers();
    console.log(3);
  }

  async getMembers(){
    await this.http.get<Member[]>("https://localhost:7174/api/Members/getmembers").subscribe({
      next: (response) => {
        this.members.set(response);
        console.log(2);
      },
      error: (error) => console.log(error),
      complete: () => console.log("Request completed")
    })
  }

}
