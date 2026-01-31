import { Routes } from '@angular/router';
import { CustomersListComponent } from './components/customers-list/customers-list.component';
import { CustomersFormComponent } from './components/customers-form/customers-form.component';

export const customersRoutes: Routes = [
  {
    path: '', 
    children: [
      { path: '', component: CustomersListComponent },
      { path: 'new', component: CustomersFormComponent },
      { path: 'edit/:id', component: CustomersFormComponent },
    ]
  }
];
