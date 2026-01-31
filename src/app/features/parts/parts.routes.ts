import { Routes } from "@angular/router";
import { PartCatalogListComponent } from "./components/part-catalog-list/part-catalog-list.component";
import { PartCatalogFormComponent } from "./components/part-catalog-form/part-catalog-form.component";

export const partsRoutes: Routes = [
    {path: '', component: PartCatalogListComponent},
    {path: 'new', component: PartCatalogFormComponent},
    {path: 'edit/:id', component: PartCatalogFormComponent},
]
