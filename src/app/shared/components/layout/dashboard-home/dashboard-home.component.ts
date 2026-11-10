import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { CustomerService } from '../../../../features/customers/services/customers.service';
import { PhoneService } from '../../../../features/phones/services/phone.service';
import { PartCatalogService } from '../../../../features/parts/services/parts-catalog.service';
import { RepairService } from '../../../../features/repairs/services/repair.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Repair } from '../../../models/repair';
import { SpinnerComponent } from '../../spinner/spinner.component';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterModule, SpinnerComponent],
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.css'],
})
export class DashboardHomeComponent implements OnInit {
  private customers = inject(CustomerService);
  private phones = inject(PhoneService);
  private parts = inject(PartCatalogService);
  private repairs = inject(RepairService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  readonly today = new Date();
  isLoading = true;
  hasError = false;
  repairsAvailable = false;
  totalRepairs: number | null = null;
  totalCustomers: number | null = null;
  totalPhones: number | null = null;
  lowStockCount: number | null = null;
  pendingCount: number | null = null;
  readyCount: number | null = null;
  recentRepairs: Repair[] = [];
  statusCounts: { label: string; count: number; className: string }[] = [];

  get admin(): boolean {
    return this.auth.isAdmin();
  }
  get username(): string {
    return this.auth.username;
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;
    forkJoin({
      customers: this.customers
        .getCountCustomers()
        .pipe(catchError(() => of(null))),
      phones: this.phones.getCountPhones().pipe(catchError(() => of(null))),
      parts: this.parts.getPartsCatalog().pipe(catchError(() => of(null))),
      repairs: this.repairs.getRepairs().pipe(catchError(() => of(null))),
    })
      .pipe(
        finalize(() => (this.isLoading = false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ customers, phones, parts, repairs }) => {
        this.totalCustomers = customers;
        this.totalPhones = phones;
        this.lowStockCount =
          parts === null
            ? null
            : parts.filter((p) => p.quantity <= p.minStock).length;
        this.hasError = [customers, phones, parts, repairs].some(
          (value) => value === null,
        );
        this.repairsAvailable = repairs !== null;
        this.totalRepairs = repairs?.length ?? null;
        this.pendingCount =
          repairs?.filter((r) => this.normalizeState(r.state) === 'Pendiente')
            .length ?? null;
        this.readyCount =
          repairs?.filter((r) => this.normalizeState(r.state) === 'Completado')
            .length ?? null;
        const states = [
          { label: 'Pendiente', className: 'status-pendiente' },
          { label: 'En Proceso', className: 'status-en-proceso' },
          { label: 'Esperando repuestos', className: 'status-pendiente' },
          { label: 'Completado', className: 'status-completado' },
          { label: 'Entregado', className: 'status-entregado' },
          { label: 'Cancelado', className: 'status-cancelado' },
        ];
        this.statusCounts = states.map((s) => ({
          ...s,
          count: (repairs || []).filter(
            (r) => this.normalizeState(r.state) === s.label,
          ).length,
        }));
        const known = new Set(states.map((s) => s.label));
        const other = (repairs || []).filter(
          (r) => !known.has(this.normalizeState(r.state)),
        ).length;
        if (other)
          this.statusCounts.push({
            label: 'Otros estados',
            className: '',
            count: other,
          });
        this.recentRepairs = [...(repairs || [])]
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )
          .slice(0, 5);
      });
  }

  normalizeState(state: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pendiente',
      IN_PROGRESS: 'En Proceso',
      WAITING_PARTS: 'Esperando repuestos',
      COMPLETED: 'Completado',
      DELIVERED: 'Entregado',
      CANCELLED: 'Cancelado',
    };
    return labels[state] || state;
  }

  statusClass(state: string): string {
    return (
      this.statusCounts.find((s) => s.label === this.normalizeState(state))
        ?.className || ''
    );
  }
}
