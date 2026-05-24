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
                component: MemberDetailed
            },
            { path: 'lists', component: Lists },
            { path: 'messages', component: Messages },
        ]
  },

  { path: 'errors', component: TestErrors },
  { path: 'server-error', component: ServerError },

  { path: "**", component: NotFound},


];
