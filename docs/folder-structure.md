# Angular 20 Standalone Project - Folder Structure

This document explains the folder structure of an Angular 20 standalone project.

## Overview

Angular 20 uses a **standalone component** architecture by default, eliminating the need for NgModules. This makes the project structure simpler and more straightforward.

## Root-Level Files

### Configuration Files

- **`angular.json`** - Main Angular CLI configuration file that defines project settings, build configurations, and architect targets for building, serving, and testing the application.

- **`package.json`** - NPM package configuration file that lists project dependencies, devDependencies, and npm scripts for running the application.

- **`tsconfig.json`** - Base TypeScript compiler configuration that sets compiler options for the entire project.

- **`tsconfig.app.json`** - TypeScript configuration specific to the application code, extends the base tsconfig.json.

- **`tsconfig.spec.json`** - TypeScript configuration for unit tests, includes test-specific compiler options.

- **`README.md`** - Project documentation and instructions for developers.

## Directory Structure

### `/docs`

Contains project documentation files, including architecture decisions, API documentation, and guides like this folder structure explanation.

### `/public`

Stores static assets that are copied directly to the build output without processing:
- Images
- Favicon
- Static JSON files
- Any files that don't need to be processed by the build system

These files are accessible via root-relative URLs (e.g., `/favicon.ico`).

### `/src`

The main source code directory containing all application code.

#### Root Source Files

- **`index.html`** - The main HTML file that serves as the entry point for the application. Contains the root component selector (typically `<app-root>`).

- **`main.ts`** - The application bootstrap file that initializes the Angular application using `bootstrapApplication()` with the root standalone component.

- **`styles.scss`** - Global styles for the entire application using SCSS syntax.

#### `/src/app`

The core application directory containing all components, services, and application logic.

##### Standalone Component Files

In Angular 20 standalone architecture, components are self-contained without NgModules:

- **`app.ts`** - The root standalone component class decorated with `@Component`. Contains the component logic and metadata including:
  - `standalone: true` flag
  - Imports array for dependencies (other components, directives, pipes)
  - Component selector, template, and style references

- **`app.html`** - The component template file containing the HTML markup for the root component.

- **`app.scss`** - Component-specific styles scoped to the root component.

- **`app.config.ts`** - Application configuration file that provides the configuration object for `bootstrapApplication()`. Contains:
  - Providers for services and dependency injection
  - Router configuration
  - HTTP client setup
  - Other application-wide configurations

- **`app.routes.ts`** - Routing configuration file that defines the application's routes using the new functional routing API:
  - Route definitions
  - Lazy loading configurations
  - Route guards and resolvers

## Key Differences from Module-Based Angular

### Standalone Architecture Benefits

1. **No NgModules** - Components declare their own dependencies directly in the `imports` array.

2. **Simplified Structure** - Fewer files and less boilerplate code.

3. **Better Tree-Shaking** - Unused code is more easily eliminated during build.

4. **Easier Lazy Loading** - Routes can directly lazy load standalone components without wrapper modules.

5. **Component-Centric** - Each component is self-sufficient and declares what it needs.

### Bootstrapping

Instead of bootstrapping with `platformBrowserDynamic().bootstrapModule(AppModule)`, standalone apps use:

```typescript
bootstrapApplication(AppComponent, appConfig)
```

### Component Imports

Standalone components directly import what they need:

```typescript
@Component({
  standalone: true,
  imports: [CommonModule, RouterOutlet, MyOtherComponent],
  // ...
})
```

## Additional Directories (As Needed)

As your application grows, you'll typically add:

- **`/src/app/components`** - Reusable UI components
- **`/src/app/pages`** - Page-level components (route targets)
- **`/src/app/services`** - Business logic and data services
- **`/src/app/models`** - TypeScript interfaces and types
- **`/src/app/guards`** - Route guards for protecting routes
- **`/src/app/interceptors`** - HTTP interceptors
- **`/src/app/pipes`** - Custom pipes for data transformation
- **`/src/app/directives`** - Custom directives
- **`/src/assets`** - Assets that need build processing (images, fonts, etc.)
- **`/src/environments`** - Environment-specific configuration files

## Build Output

When you build the application (`ng build`), the output is generated in the `/dist` directory (configurable in angular.json).

## Summary

The Angular 20 standalone project structure is streamlined and focused on components as the primary building blocks. This modern architecture reduces complexity while maintaining Angular's powerful features like dependency injection, routing, and change detection.
