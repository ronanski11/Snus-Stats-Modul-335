import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'tab4',
    loadComponent: () => import('./tab4/tab4.page').then((m) => m.Tab4Page),
  },
  {
    path: 'snus-entry',
    loadComponent: () =>
      import('./snus-entry/snus-entry.page').then((m) => m.SnusEntryPage),
  },
  {
    path: 'snus-history',
    loadComponent: () =>
      import('./snus-history/snus-history.page').then((m) => m.SnusHistoryPage),
  },
  {
    path: 'map',
    loadComponent: () => import('./map/map.page').then( m => m.MapPage)
  },
];
