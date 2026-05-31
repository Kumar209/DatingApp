import { Routes } from '@angular/router';
import { Login } from '../features/account/login/login';
import { Register } from '../features/account/register/register';
import { AuthLayout } from '../features/account/auth-layout/auth-layout';
import { Home } from '../features/home/home';
import { MemberList } from '../features/members/member-list/member-list';
import { MemberDetailed } from '../features/members/member-detailed/member-detailed';
import { Lists } from '../features/lists/lists';
import { Messages } from '../features/messages/messages';
import { authGuard } from '../core/guards/auth-guard';
import { guestGuard } from '../core/guards/guest-guard';
import { TestErrors } from '../features/test-errors/test-errors';
import { NotFound } from '../shared/errors/not-found/not-found';
import { ServerError } from '../shared/errors/server-error/server-error';
import { memberResolver } from '../features/members/member-resolver';
import { MemberProfile } from '../features/members/member-profile/member-profile';
import { MemberPhotos } from '../features/members/member-photos/member-photos';
import { MemberMessages } from '../features/members/member-messages/member-messages';
import { preventUnsavedChangesGuard } from '../core/guards/prevent-unsaved-changes-guard';
import { Admin } from '../features/admin/admin';
import { adminGuard } from '../core/guards/admin-guard';
import { UserManagement } from '../features/admin/user-management/user-management';
import { PhotoManagement } from '../features/admin/photo-management/photo-management';

export const routes: Routes = [
   {
    path: 'auth',
    component: AuthLayout,
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        component: Login
      },
      {
        path: 'register',
        component: Register
      }
    ]
  },
  { path: '', component: Home },
  {
    path: '',
    runGuardsAndResolvers: 'always',
    canActivate: [authGuard],
    children: [
            { path: 'members', component: MemberList },
            { 
                path: 'members/:id', 
                runGuardsAndResolvers: 'always',
                resolve: {member: memberResolver},
                component: MemberDetailed,
                 children: [
                    {path: '', redirectTo: 'profile', pathMatch: 'full'},
                    {path: 'profile', component: MemberProfile, title: 'Profile',  canDeactivate: [preventUnsavedChangesGuard]},
                    {path: 'photos', component: MemberPhotos, title: 'Photos'},
                    {path: 'messages', component: MemberMessages, title: 'Messages'},
                ]
            },
            { path: 'lists', component: Lists },
            { path: 'messages', component: Messages },
            {
              path: 'admin',
              component: Admin,
              canActivate: [adminGuard],
              children: [
                { path: '', redirectTo: 'users',  pathMatch: 'full' },
                { path: 'users', component: UserManagement },
                { path: 'photos', component: PhotoManagement }
              ]
            }
        ]
  },

  { path: 'errors', component: TestErrors },
  { path: 'server-error', component: ServerError },

  { path: "**", component: NotFound},


];
