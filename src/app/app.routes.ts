import { Routes } from '@angular/router';
import { authGuard } from './shared/auth.guard';
import { LayoutShell } from './shared/layout-shell/layout-shell';

export const routes: Routes = [
	{
		path: 'login',
		loadComponent: () => import('./features/login/login').then((m) => m.Login),
	},
	{
		path: '',
		component: LayoutShell,
		canActivate: [authGuard],
		children: [
			{
				path: '',
				loadComponent: () => import('./features/home/home').then((m) => m.Home),
			},
		],
	},
	{
		path: '**',
		redirectTo: '',
	},
];
