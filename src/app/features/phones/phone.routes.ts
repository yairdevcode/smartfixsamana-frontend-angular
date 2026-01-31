import { Routes } from "@angular/router";
import { PhoneListComponent } from "./components/phone-list/phone-list.component";
import { PhoneFormComponent } from "./components/phone-form/phone-form.component";

export const phonesRoutes: Routes = [
  { path: '', component: PhoneListComponent },
  { path: 'new', component: PhoneFormComponent },
  { path: 'edit/:id', component: PhoneFormComponent },
];