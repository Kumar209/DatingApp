import { Component, computed, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';

import { AdminService } from '../../../core/services/admin-service';
import { ManagedUserParams, User } from '../../../types/user';
import { PaginatedResult } from '../../../types/pagination';
import { Paginator } from '../../../shared/paginator/paginator';
import { ManagedUserFilterModal } from './managed-user-filter-modal/managed-user-filter-modal';
import { ToastService } from '../../../core/services/toast-service';

@Component({
  selector: 'app-user-management',
  imports: [Paginator, ManagedUserFilterModal],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css',
})
export class UserManagement implements OnInit {
  @ViewChild('rolesModal')
  rolesModal!: ElementRef<HTMLDialogElement>;

  @ViewChild(ManagedUserFilterModal)
  filterModal!: ManagedUserFilterModal;

  private adminService = inject(AdminService);
  
  protected toastr = inject(ToastService);

  protected paginatedUsers = signal<PaginatedResult<User> | null>(null);

  protected users = computed(() => this.paginatedUsers()?.items ?? []);

  protected managedMemberParams = new ManagedUserParams();

  protected managedUpdatedParams = new ManagedUserParams();

  protected availableRoles = ['Member', 'Moderator', 'Admin'];

  protected selectedUser: User | null = null;

  protected totalUsers = computed(() => this.paginatedUsers()?.metadata.totalCount ?? 0);

  protected totalAdmins = computed(
    () => this.users().filter((x) => x.roles.includes('Admin')).length,
  );

  protected totalModerators = computed(
    () => this.users().filter((x) => x.roles.includes('Moderator')).length,
  );

  protected totalMembers = computed(
    () => this.users().filter((x) => x.roles.includes('Member')).length,
  );

  constructor() {
    const filters = localStorage.getItem('managed-filter');

    if (filters) {
      this.managedMemberParams = JSON.parse(filters);
      this.managedUpdatedParams = JSON.parse(filters);
    }
  }

  ngOnInit(): void {
    this.getUserWithRoles();
  }

  getUserWithRoles() {
    this.adminService.getUserWithRoles(this.managedMemberParams).subscribe({
      next: (result) => {
        this.paginatedUsers.set(result);
      },
    });
  }

  onPageChange(event: { pageNumber: number; pageSize: number }) {
    this.managedMemberParams.pageNumber = event.pageNumber;

    this.managedMemberParams.pageSize = event.pageSize;

    this.getUserWithRoles();
  }

  openFilterModal() {
    this.filterModal.open();
  }

  closeFilterModal() {
    this.filterModal.close();
  }

  applyFilters() {
    this.managedMemberParams = {
      ...this.managedUpdatedParams,
      pageNumber: 1,
    };

    this.getUserWithRoles();

    this.closeFilterModal();
  }

  resetFilters() {
    this.managedMemberParams = new ManagedUserParams();

    this.managedUpdatedParams = new ManagedUserParams();

    localStorage.removeItem('managed-filter');

    this.getUserWithRoles();

    this.closeFilterModal();
  }

  getInitials(displayName: string): string {
    if (!displayName) return 'U';

    const parts = displayName.trim().split(' ').filter(Boolean);

    if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  openRolesModal(user: User) {
    this.selectedUser = {
      ...user,
      roles: [...user.roles],
    };

    this.rolesModal.nativeElement.showModal();
  }

  toggleRole(event: Event, role: string) {
    if (!this.selectedUser) return;

    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      if (!this.selectedUser.roles.includes(role)) {
        this.selectedUser.roles.push(role);
      }
    } else {
      this.selectedUser.roles = this.selectedUser.roles.filter((x) => x !== role);
    }
  }

  updateRoles() {
    if (!this.selectedUser) return;

    this.rolesModal.nativeElement.close();

    this.adminService.updateUserRoles(this.selectedUser.id, this.selectedUser.roles).subscribe({
      next: (updatedRoles) => {
        const current = this.paginatedUsers();

        if (!current) return;

        this.paginatedUsers.set({
          ...current,
          items: current.items.map((user) => {
            if (user.id === this.selectedUser?.id) {
              return {
                ...user,
                roles: updatedRoles,
              };
            }

            return user;
          }),
        });

        this.toastr.success('Roles updated successfully');
      },

      error: (error) => {
        console.error('Failed to update roles', error);
      },
    });
  }

  onFilterChange(data: ManagedUserParams) {
    this.managedMemberParams = {
      ...data,
      pageNumber: 1,
    };

    this.managedUpdatedParams = {
      ...data,
    };

    this.getUserWithRoles();
  }
}
