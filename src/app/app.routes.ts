import { Routes } from '@angular/router';
import { Shell } from './features/shell/shell/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      {
        path: '',
        redirectTo: 'entries',
        pathMatch: 'full',
      },
      {
        path: 'entries',
        loadComponent: () =>
          //import the EntriesListComponent lazily
          import('./features/entries/entries-list/entries-list').then(
            (m) => m.EntriesListComponent,
          ),
      },
      {
        path: 'entries/new',
        loadComponent: () =>
          import('./features/entries/new-entry/new-entry').then(
            (m) => m.NewEntryComponent,
          ),
      },
      {
        path: 'entries/:id/edit',
        loadComponent: () =>
          import('./features/entries/edit-entry/edit-entry').then(
            (m) => m.EditEntryComponent,
          ),
      },
    ],
  },
];
