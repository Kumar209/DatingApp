import {
  Component,
  effect,
  ElementRef,
  inject,
  model,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { MessageService } from '../../../core/services/message-service';
import { MemberService } from '../../../core/services/member-service';
import { Message } from '../../../types/message';
import { DatePipe } from '@angular/common';
import { TimeAgoPipe } from '../../../core/pipes/time-ago-pipe';
import { FormsModule } from '@angular/forms';
// import { PresenceService } from '../../../core/services/presence-service';
import { ActivatedRoute } from '@angular/router';
import { AccountService } from '../../../core/services/account-service';

@Component({
  selector: 'app-member-messages',
  imports: [DatePipe, TimeAgoPipe, FormsModule],
  templateUrl: './member-messages.html',
  styleUrl: './member-messages.css',
})
export class MemberMessages implements OnInit, OnDestroy {
  @ViewChild('messageEndRef') messageEndRef!: ElementRef;
  protected messageService = inject(MessageService);
  protected memberService = inject(MemberService);
  private accountService = inject(AccountService);
  // protected presenceService = inject(PresenceService);
  private route = inject(ActivatedRoute);
  protected messageContent = model('');
  protected sendingMessage = signal(false);

  constructor() {
    effect(() => {
      const currentMessages = this.messageService.messageThread();

      if (currentMessages.length > 0) {
        this.scrollToBottom();
      }
    });
  }

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe({
      next: (params) => {
        const otherUserId = params.get('id');
        if (!otherUserId) throw new Error('Cannot connect to hub');
        this.loadMessages();
        // this.messageService.createHubConnection(otherUserId);
      },
    });
  }

loadMessages() {
  const memberId = this.memberService.member()?.id;

  if (!memberId) return;

  const currentUserId = this.accountService.currentUser()?.id;

  this.messageService.getMessageThread(memberId).subscribe({
    next: (messages) => {

      const updatedMessages = messages.map((message) => ({
        ...message,
        currentUserSender: message.senderId === currentUserId,
      }));

      this.messageService.messageThread.set(updatedMessages);
    },
  });
}

  // sendMessage() {
  //   const recipientId = this.memberService.member()?.id;

  //   if (!recipientId || !this.messageContent()) return;

  //   this.messageService.sendMessage(recipientId, this.messageContent())?.then(() => {
  //     this.messageContent.set('');
  //   })
  // }

  sendMessage() {
    const recipientId = this.memberService.member()?.id;

    if (!recipientId || !this.messageContent().trim() || this.sendingMessage()) return;

    this.sendingMessage.set(true);

    this.messageService.sendMessage(recipientId, this.messageContent()).subscribe({
      next: (message) => {
        this.messageContent.set('');

        this.messageService.messageThread.update((messages) => [
          ...messages,
          {
            ...message,
            currentUserSender: true,
          },
        ]);

        this.sendingMessage.set(false);
      },

      error: () => {
        this.sendingMessage.set(false);
      },
    });
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.messageEndRef) {
        this.messageEndRef.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  ngOnDestroy(): void {
    // this.messageService.stopHubConnection();
  }
}
