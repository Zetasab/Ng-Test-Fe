import { Route, Routes } from '@angular/router';
import { routes } from '../app.routes';
import { adminGuard, hasCurrentUserAnyPermission, isCurrentUserAdmin } from './auth.guard';

type RouteAccessRule = {
  path: string;
  requiresAdmin: boolean;
  requiredPermissions: string[];
};

const routeAccessRules = buildRouteAccessRules(routes);

export function canDisplayRouteLink(path: string): boolean {
  const normalizedPath = normalizePath(path);
  const accessRule = routeAccessRules.find((rule) => rule.path === normalizedPath);

  if (!accessRule) {
    return true;
  }

  if (accessRule.requiresAdmin && isCurrentUserAdmin()) {
    return true;
  }

  if (accessRule.requiredPermissions.length) {
    return hasCurrentUserAnyPermission(accessRule.requiredPermissions);
  }

  return !accessRule.requiresAdmin;
}

function buildRouteAccessRules(routeConfig: Routes): RouteAccessRule[] {
  return flattenRouteRules(routeConfig, '').filter((rule) => !!rule.path);
}

function flattenRouteRules(routeConfig: Routes, parentPath: string): RouteAccessRule[] {
  const collectedRules: RouteAccessRule[] = [];

  for (const route of routeConfig) {
    if (!route.path || route.path === '**') {
      if (route.children?.length) {
        collectedRules.push(...flattenRouteRules(route.children, parentPath));
      }
      continue;
    }

    const currentPath = joinRoutePath(parentPath, route.path);

    if (isNavigableRoute(route)) {
      collectedRules.push({
        path: normalizePath(currentPath),
        requiresAdmin: route.canActivate?.includes(adminGuard) ?? false,
        requiredPermissions: getRoutePermissions(route),
      });
    }

    if (route.children?.length) {
      collectedRules.push(...flattenRouteRules(route.children, currentPath));
    }
  }

  return collectedRules;
}

function isNavigableRoute(route: Route): boolean {
  return !!route.loadComponent || !!route.component;
}

function joinRoutePath(parentPath: string, childPath: string): string {
  const segments = [parentPath, childPath].filter((segment) => !!segment && segment !== '/');
  return `/${segments.join('/')}`;
}

function normalizePath(path: string): string {
  if (!path) {
    return '/';
  }

  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  const withoutTrailingSlash = withLeadingSlash.length > 1 && withLeadingSlash.endsWith('/')
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;

  return withoutTrailingSlash.replace(/\/+/g, '/');
}

function getRoutePermissions(route: Route): string[] {
  const routePermissions = route.data?.['permissions'];

  if (!Array.isArray(routePermissions)) {
    return [];
  }

  return routePermissions.filter((permission): permission is string => typeof permission === 'string');
}
