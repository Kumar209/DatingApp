import { Routes } from '@angular/router';
import { Login } from '../features/account/login/login';
import { Register } from '../features/account/register/register';
import { AuthLayout } from '../features/account/auth-layout/auth-layout';
import { Home } from '../features/home/home';

export const routes: Routes = [
   {
    path: 'auth',
    component: AuthLayout,
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
  {
    path: '',
    component: Home
  }
];
