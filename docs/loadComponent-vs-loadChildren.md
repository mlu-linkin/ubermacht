# loadComponent vs loadChildren in Angular Routing

This document explains the differences between `loadComponent` and `loadChildren` in Angular routing, their use cases, and best practices.

## Overview

Angular's routing system supports lazy loading to improve application performance by loading code only when needed. With the introduction of standalone components in Angular, there are two primary approaches for lazy loading:

- **`loadComponent`** - For lazy loading standalone components
- **`loadChildren`** - For lazy loading child routes or route configurations

## loadComponent

### What is loadComponent?

`loadComponent` is used to lazy load a **single standalone component** when a route is activated. This is the most straightforward approach for lazy loading in standalone Angular applications.

### Syntax

```typescript
{
  path: 'dashboard',
  loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
}
```

### When to Use loadComponent

Use `loadComponent` when you want to:

1. **Lazy load a single page/view** - The route points directly to one component
2. **Keep routing simple** - No child routes are needed at this level
3. **Load standalone components** - The component must have `standalone: true`
4. **Optimize initial bundle size** - Component and its dependencies load on-demand

### Example

```typescript
// app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent)
  }
];
```

### What Gets Loaded?

When using `loadComponent`, Angular loads:
- The component class
- The component's template and styles
- All imports declared in the component's `imports` array
- Any services provided in the component's `providers` array

## loadChildren

### What is loadChildren?

`loadChildren` is used to lazy load an **entire routing configuration** (a set of child routes). This is useful when you have a feature area with multiple related routes that should be loaded together.

### Syntax

```typescript
{
  path: 'admin',
  loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES)
}
```

### When to Use loadChildren

Use `loadChildren` when you want to:

1. **Lazy load a feature module with multiple routes** - A section of your app with its own routing
2. **Group related routes together** - Dashboard with sub-pages, admin area, user profile sections
3. **Create route hierarchies** - Parent route with multiple child routes
4. **Share layout or shell components** - All child routes render within a common layout

### Example

```typescript
// app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'user',
    loadChildren: () => import('./features/user/user.routes').then(m => m.USER_ROUTES)
  }
];
```

```typescript
// features/admin/admin.routes.ts
import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./shell/admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent)
      }
    ]
  }
];
```

### What Gets Loaded?

When using `loadChildren`, Angular loads:
- The entire route configuration array
- All components referenced in that configuration (when their routes are activated)
- Any providers defined at the route level
- Shell/layout components if defined

## Key Differences

| Aspect | loadComponent | loadChildren |
|--------|---------------|--------------|
| **Purpose** | Load a single component | Load a route configuration |
| **Returns** | A component class | A Routes array |
| **Use Case** | Simple page/view | Feature area with multiple routes |
| **Complexity** | Simple, flat routing | Complex, nested routing |
| **Child Routes** | Cannot define child routes directly | Can define entire route hierarchies |
| **Layout/Shell** | Not applicable | Perfect for shared layouts |

## Combining Both Approaches

You can use both `loadComponent` and `loadChildren` in the same application:

```typescript
export const routes: Routes = [
  // Simple pages with loadComponent
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent)
  },
  
  // Feature areas with loadChildren
  {
    path: 'products',
    loadChildren: () => import('./features/products/products.routes').then(m => m.PRODUCT_ROUTES)
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  }
];
```

## Real-World Pattern: Shell Component with loadChildren

A common pattern is using `loadChildren` with a shell component that provides a layout:

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
  }
];

// features/dashboard/dashboard.routes.ts
export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./shell/dashboard-shell.component').then(m => m.DashboardShellComponent),
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full'
      },
      {
        path: 'overview',
        loadComponent: () => import('./pages/overview/overview.component').then(m => m.OverviewComponent)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./pages/analytics/analytics.component').then(m => m.AnalyticsComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent)
      }
    ]
  }
];
```

In this pattern:
- The shell component provides the layout (sidebar, header, navigation)
- Child components render in the shell's `<router-outlet>`
- All routes share the same shell/layout
- Each page is still lazy loaded individually

## Performance Considerations

### loadComponent
- **Smaller initial chunks** - Each component is a separate chunk
- **More granular loading** - Only loads what's needed for that specific route
- **More HTTP requests** - Each component requires a separate chunk download
- **Best for**: Simple pages, infrequently visited routes

### loadChildren
- **Larger chunks** - Entire route configuration and potentially multiple components
- **Fewer HTTP requests** - Related routes loaded together
- **Better for feature cohesion** - All related code in one bundle
- **Best for**: Feature areas, frequently navigated sections, related pages

## Migration from NgModule-based Routing

### Before (with NgModules)
```typescript
{
  path: 'admin',
  loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
}
```

### After (with Standalone)
```typescript
{
  path: 'admin',
  loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES)
}
```

The syntax is similar, but you're loading routes instead of modules!

## Best Practices

1. **Use `loadComponent` for simple pages** - Single components without child routes

2. **Use `loadChildren` for feature areas** - Sections with multiple related routes

3. **Keep route files close to features** - Co-locate routes with their components

4. **Use meaningful chunk names** - Help with debugging:
   ```typescript
   loadComponent: () => import(/* webpackChunkName: "dashboard" */ './dashboard/dashboard.component')
   ```

5. **Combine with route guards** - Lazy load only after authorization checks

6. **Consider preloading strategies** - For frequently accessed routes

7. **Organize by feature** - Group related components and routes together

## Summary

- **`loadComponent`** = Lazy load one standalone component
- **`loadChildren`** = Lazy load a set of routes (route configuration)

Choose based on your routing complexity:
- Simple page? Use `loadComponent`
- Feature area with multiple pages? Use `loadChildren`
- Both can coexist in the same application for optimal code splitting

The standalone component architecture makes lazy loading more intuitive and eliminates the need for NgModules entirely!
