import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { withNgxsReduxDevtoolsPlugin } from '@ngxs/devtools-plugin';
import { routes } from './app.routes';
import { provideStore } from '@ngxs/store';
import { EntriesState } from './store/state';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideStore([EntriesState], withNgxsReduxDevtoolsPlugin()),
  ]
};
