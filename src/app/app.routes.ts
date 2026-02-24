import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './shared/auth.guard';
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
			{
				path: 'games/developer',
				canActivate: [adminGuard],
				loadComponent: () => import('./features/games/developer-page/developer-page').then((m) => m.DeveloperPage),
			},
			{
				path: 'games/game',
				loadComponent: () => import('./features/games/game-page/game-page').then((m) => m.GamePage),
			},
			{
				path: 'games/gamesearch',
				loadComponent: () => import('./features/games/gamesearch-page/gamesearch-page').then((m) => m.GamesearchPage),
			},
			{
				path: 'games/genre',
				canActivate: [adminGuard],
				loadComponent: () => import('./features/games/genre-page/genre-page').then((m) => m.GenrePage),
			},
			{
				path: 'games/platform',
				canActivate: [adminGuard],
				loadComponent: () => import('./features/games/platform-page/platform-page').then((m) => m.PlatformPage),
			},
			{
				path: 'games/review',
				canActivate: [adminGuard],
				loadComponent: () => import('./features/games/review-page/review-page').then((m) => m.ReviewPage),
			},
			{
				path: 'games/tag',
				canActivate: [adminGuard],
				loadComponent: () => import('./features/games/tag-page/tag-page').then((m) => m.TagPage),
			},
			{
				path: 'users',
				canActivate: [adminGuard],
				loadComponent: () => import('./features/users/user-page/user-page').then((m) => m.UserPage),
			},
		],
	},
	{
		path: '**',
		redirectTo: '',
	},
];
