import { Routes } from "@angular/router";
import { PartTypeListComponent } from "./components/part-type-list/part-type-list.component";
import { PartTypeFormComponent } from "./components/part-type-form/part-type-form.component";

export const partTypesRoutes: Routes = [
    {path: '', component: PartTypeListComponent},
    {path: 'new', component: PartTypeFormComponent},
    {path: 'edit/:id', component: PartTypeFormComponent},
]
