import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { DashboardHomeComponent } from './dashboard-home.component';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

describe('DashboardHomeComponent data integrity', () => {
  let fixture: ComponentFixture<DashboardHomeComponent>;
  let http: HttpTestingController;
  const base = environment.apiUrl;
  const customer = {
    id: 1,
    name: 'Cliente',
    lastname: 'Prueba',
    phone: '3000000000',
  };
  const phone = { id: 1, brand: 'Samsung', model: 'A54' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashboardHomeComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { isAdmin: () => true, username: 'Taller' },
        },
      ],
    });
    fixture = TestBed.createComponent(DashboardHomeComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });
  afterEach(() => http.verify());

  function counts() {
    http.expectOne(`${base}/customers/count`).flush(7);
    http.expectOne(`${base}/phones/count`).flush(3);
  }

  it('counts actual records, normalizes known states and orders by entry date', () => {
    counts();
    http.expectOne(`${base}/api/parts-catalog/all`).flush([
      { id: 1, quantity: 2, minStock: 2 },
      { id: 2, quantity: 5, minStock: 2 },
    ]);
    http.expectOne(`${base}/repairs`).flush([
      { id: 1, customer, phone, state: 'Pendiente', date: '2026-01-01' },
      { id: 2, customer, phone, state: 'COMPLETED', date: '2026-03-01' },
      { id: 3, customer, phone, state: 'Entregado', date: '2026-02-01' },
      { id: 4, customer, phone, state: 'WAITING_PARTS', date: '2026-02-02' },
      { id: 5, customer, phone, state: 'Estado adicional', date: '2026-02-03' },
    ]);
    const c = fixture.componentInstance;
    expect(c.totalRepairs).toBe(5);
    expect(c.pendingCount).toBe(1);
    expect(c.readyCount).toBe(1);
    expect(c.lowStockCount).toBe(1);
    expect(c.statusCounts.reduce((sum, status) => sum + status.count, 0)).toBe(
      5,
    );
    expect(c.recentRepairs[0].id).toBe(2);
  });

  it('shows zero for a successful empty response', () => {
    counts();
    http.expectOne(`${base}/api/parts-catalog/all`).flush([]);
    http.expectOne(`${base}/repairs`).flush([]);
    expect(fixture.componentInstance.totalRepairs).toBe(0);
    expect(fixture.componentInstance.pendingCount).toBe(0);
    expect(fixture.componentInstance.lowStockCount).toBe(0);
    expect(fixture.componentInstance.hasError).toBeFalse();
  });

  it('keeps successful metrics when repairs fail, showing missing data instead of zero', () => {
    counts();
    http
      .expectOne(`${base}/api/parts-catalog/all`)
      .flush([{ id: 1, quantity: 0, minStock: 1 }]);
    http
      .expectOne(`${base}/repairs`)
      .flush('Unavailable', { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    const c = fixture.componentInstance;
    expect(c.totalCustomers).toBe(7);
    expect(c.lowStockCount).toBe(1);
    expect(c.totalRepairs).toBeNull();
    expect(c.pendingCount).toBeNull();
    expect(c.readyCount).toBeNull();
    expect(c.isLoading).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Sin datos');
  });

  it('allows a failed dashboard to be retried', () => {
    counts();
    http
      .expectOne(`${base}/api/parts-catalog/all`)
      .flush(null, { status: 500, statusText: 'Error' });
    http.expectOne(`${base}/repairs`).flush([]);
    fixture.componentInstance.loadData();
    counts();
    http.expectOne(`${base}/api/parts-catalog/all`).flush([]);
    http.expectOne(`${base}/repairs`).flush([]);
    expect(fixture.componentInstance.hasError).toBeFalse();
    expect(fixture.componentInstance.lowStockCount).toBe(0);
  });
});
