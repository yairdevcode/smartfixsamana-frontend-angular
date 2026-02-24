import { Routes } from '@angular/router';
import { ExternalRepairListComponent } from './components/external-repair-list/external-repair-list.component';
import { ExternalRepairFormComponent } from './components/external-repair-form/external-repair-form.component';
import { SettlementListComponent } from './components/settlement-list/settlement-list.component';

export const externalRepairsRoutes: Routes = [
  { path: '', component: ExternalRepairListComponent },
  { path: 'new', component: ExternalRepairFormComponent },
  { path: 'edit/:id', component: ExternalRepairFormComponent },
  { path: 'settlements', component: SettlementListComponent }
];
