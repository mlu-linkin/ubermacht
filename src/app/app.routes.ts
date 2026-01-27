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
          import('./features/entries/entries-list/entries-list').then(m => m.EntriesListComponent),
      },
    ],
  },
];
