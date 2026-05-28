import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MessageService } from '../../core/services/message-service';
import { PaginatedResult } from '../../types/pagination';
import { Message } from '../../types/message';
import { Paginator } from '../../shared/paginator/paginator';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ConfirmDialogService } from '../../core/services/confirm-dialog-service';

@Component({
  selector: 'app-messages',
  imports: [Paginator, RouterLink, DatePipe],
  templateUrl: './messages.html',
  styleUrl: './messages.css',
})
export class Messages implements OnInit {
  private messageService = inject(MessageService);
  private confirmDialog = inject(ConfirmDialogService);
  protected container = 'Inbox';
  protected fetchedContainer = 'Inbox';
  protected pageNumber = 1;
  protected pageSize = 10;
  protected paginatedMessages = signal<PaginatedResult<Message> | null>(null);
  protected selectedMemberId = signal<string | null>(null);
  protected mobileConversationOpen = signal(false);

  tabs = [
    { label: 'Inbox', value: 'Inbox', icon: '📥' },
    { label: 'Outbox', value: 'Outbox', icon: '📤' },
  ];

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages() {
    this.messageService.getMessages(this.container, this.pageNumber, this.pageSize).subscribe({
      next: (response) => {
        this.paginatedMessages.set(response);
        this.fetchedContainer = this.container;

        const conversations = this.groupedMessages();

        if (conversations.length > 0 && !this.selectedMemberId()) {
          this.selectedMemberId.set(conversations[0].memberId);
        }
      },
    });
  }

  async confirmDelete(event: Event, id: string) {
    event.stopPropagation();
    const ok = await this.confirmDialog.confirm('Are you sure you want to delete this message?');
    if (ok) this.deleteMessage(id);
  }

  groupedMessages = computed(() => {
    const result = this.paginatedMessages();

    if (!result) return [];

    const grouped = new Map();

    for (const message of result.items) {
      const memberId = this.isInbox ? message.senderId : message.recipientId;

      const displayName = this.isInbox ? message.senderDisplayName : message.recipientDisplayName;

      const imageUrl = this.isInbox ? message.senderImageUrl : message.recipientImageUrl;

      if (!grouped.has(memberId)) {
        grouped.set(memberId, {
          memberId,
          displayName,
          imageUrl,
          lastMessage: message.content,
          lastMessageSent: message.messageSent,
          unreadCount: 0,
          messages: [],
        });
      }

      grouped.get(memberId).messages.push(message);

      if (this.isInbox && !message.dateRead) {
        grouped.get(memberId).unreadCount++;
      }
    }

    return Array.from(grouped.values());
  });

  selectedConversation = computed(() => {
    return this.groupedMessages().find((x: any) => x.memberId === this.selectedMemberId());
  });

  selectConversation(memberId: string) {
    this.selectedMemberId.set(memberId);

    this.mobileConversationOpen.set(true);
  }

  backToConversations() {
    this.mobileConversationOpen.set(false);
  }

  deleteMessage(id: string) {
    this.messageService.deleteMessage(id).subscribe({
      next: () => {
        const current = this.paginatedMessages();
        if (current?.items) {
          this.paginatedMessages.update((prev) => {
            if (!prev) return null;

            const newItems = prev.items.filter((x) => x.id !== id) || [];

            return {
              items: newItems,
              metadata: prev.metadata,
            };
          });
        }
      },
    });
  }

  get isInbox() {
    return this.fetchedContainer === 'Inbox';
  }

  setContainer(container: string) {
    this.container = container;
    this.pageNumber = 1;
    this.selectedMemberId.set(null);
    this.mobileConversationOpen.set(false);
    this.loadMessages();
  }

  onPageChange(event: { pageNumber: number; pageSize: number }) {
    this.pageSize = event.pageSize;
    this.pageNumber = event.pageNumber;
    this.loadMessages();
  }
}
