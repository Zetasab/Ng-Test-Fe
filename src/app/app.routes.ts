import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
	{
		path: '',
		canActivate: [authGuard],
		loadComponent: () => import('./features/home/home').then((m) => m.Home),
	},
	{
		path: 'login',
		loadComponent: () => import('./features/login/login').then((m) => m.Login),
	},
	{
		path: '**',
		redirectTo: '',
	},
];
