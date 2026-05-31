import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { ToastService } from './toast-service';
import { User } from '../../types/user';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { Message } from '../../types/message';

@Injectable({
  providedIn: 'root'
})

/*
|--------------------------------------------------------------------------
| PresenceService
|--------------------------------------------------------------------------
|
| Responsible for:
| - Connecting Angular client to SignalR PresenceHub
| - Tracking currently online users
| - Receiving real-time online/offline events
| - Receiving new message notifications
| - Managing SignalR connection lifecycle
|
| This service communicates with:
| - PresenceHub (Backend SignalR Hub)
| - PresenceTracker (Backend online user tracker)
|
*/

export class PresenceService {
  private hubUrl = environment.hubUrl;
  private toast = inject(ToastService);

    
  /* SignalR connection instance - Represents the active websocket connection between Angular and ASP.NET Core SignalR Hub. */
  hubConnection?: HubConnection;
  onlineUsers = signal<string[]>([]);

    /**
   * Creates a SignalR connection to PresenceHub.
   *
   * Flow:
   * Login
   *   -> SignalR Connect
   *   -> PresenceHub.OnConnectedAsync()
   *   -> User appears online
   */
  createHubConnection(user: User) {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.hubUrl + 'presence', {
        accessTokenFactory: () => user.token
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .catch(error => console.log(error));

    // Fired when another user becomes online.
    // Example payload: "abc123-user-id"
    this.hubConnection.on('UserOnline', userId => {
      this.toast.success(userId, +"User connected");
      this.onlineUsers.update(users => [...users, userId])
    })

    
    this.hubConnection.on('UserOffline', userId => {
      this.toast.success(userId, +"User offline");
      this.onlineUsers.update(users => users.filter(x => x !== userId))
    });

    // Replace the entire online user list.
    // Example: ["john", "mary", "alex"]
    this.hubConnection.on('GetOnlineUsers', userIds => {
      this.onlineUsers.set(userIds);
    });

    // Shows a toast when someone sends a new message.
    // Example:
    // "John has sent you a new message"
    this.hubConnection.on('NewMessageReceived', (message: Message) => {
      this.toast.info(message.senderDisplayName + ' has sent you a new message', 
        10000, message.senderImageUrl, `/members/${message.senderId}/messages`);
    })
  }

  /**
   * Stops SignalR connection during logout.
   *
   * Example:
   * User clicks Logout
   * -> Connection closes
   * -> PresenceHub.OnDisconnectedAsync()
   * -> User appears offline
   */
  stopHubConnection() {
    if (this.hubConnection?.state === HubConnectionState.Connected) {
      this.hubConnection.stop().catch(error => console.log(error))
    }
  }
}