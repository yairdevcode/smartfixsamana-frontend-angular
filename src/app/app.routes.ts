import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
    
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/layout/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
    children: [
       {
        path: '',
        loadComponent: () =>
          import('./shared/components/layout/dashboard-home/dashboard-home.component').then(
            (m) => m.DashboardHomeComponent
          ),
      },
      {
        path: 'dashboard-home',
        loadComponent: () =>
          import('./shared/components/layout/dashboard-home/dashboard-home.component').then(
            (m) => m.DashboardHomeComponent
          ),
      },
      {
        path: 'customers',
        loadChildren: () =>
          import('./features/customers/customers.routes').then(
            (m) => m.customersRoutes
          ),
      },
      {
        path: 'phones',
        loadChildren: () =>
          import('./features/phones/phone.routes').then(
            (m) => m.phonesRoutes
          ),
      },
      {
        path: 'repairs',
        loadChildren: () =>
          import('./features/repairs/repairs.routes').then(
            (m) => m.repairsRoutes
          ),
      },
      {
        path: 'parts',
        loadChildren: () =>
          import('./features/parts/parts.routes').then(
            (m) => m.partsRoutes
          ),
      },
      {
        path: 'part-types',
        loadChildren: () =>
          import('./features/part-types/part-types.routes').then(
            (m) => m.partTypesRoutes
          ),
      },
      {
        path: 'inventory',
        loadChildren: () =>
          import('./features/inventory/inventory.routes').then(
            (m) => m.inventoryRoutes
          ),
      },
    ],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./shared/pages/forbidden403/forbidden403.component').then(
        (m) => m.Forbidden403Component
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/pages/not-found/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
  },
];
