import { Routes } from "@angular/router";
import { InventoryDashboardComponent } from "./components/inventory-dashboard/inventory-dashboard.component";
import { StockEntryFormComponent } from "./components/stock-entry-form/stock-entry-form.component";
import { MovementHistoryComponent } from "./components/movement-history/movement-history.component";

export const inventoryRoutes: Routes = [
    { path: '', component: InventoryDashboardComponent },
    { path: 'stock-entry', component: StockEntryFormComponent },
    { path: 'movements', component: MovementHistoryComponent },
];
