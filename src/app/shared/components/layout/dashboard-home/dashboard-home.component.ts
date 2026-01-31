import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../../../features/customers/services/customers.service';
import { PartCatalogService } from '../../../../features/parts/services/parts-catalog.service';
import { PhoneService } from '../../../../features/phones/services/phone.service';
import { RepairService } from '../../../../features/repairs/services/repair.service';
import { Repair } from '../../../../shared/models/repair';
import { SpinnerComponent } from '../../spinner/spinner.component';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs';
import { Phone } from '../../../models/phone';

interface RepairsByStatus {
  pending: number;
  inProgress: number;
  completed: number;
  delivered: number;
}

interface TopRepairedDevice {
  id: number;
  brand: string;
  model: string;
  repairCount: number;
}

interface RecentActivity {
  id: number;
  type: 'repair' | 'customer' | 'device' | 'part';
  description: string;
  timestamp: Date;
  entityId?: number;
  route?: string;
}

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.css']
})
export class DashboardHomeComponent {

  // Estados de carga
  isLoadingDashboard = false;
  isLoadingStats = false;
  isLoadingCharts = false;

  // Datos básicos
  totalCustomers: number = 0;
  totalPhones: number = 0;
  totalRepairs: number = 0;
  totalParts: number = 0;

  // Datos del mes actual
  currentDate: Date = new Date();
  currentMonth: string = '';
  newCustomersThisMonth: number = 0;
  repairsThisMonth: number = 0;

  // Estadísticas de reparaciones
  repairsByStatus: RepairsByStatus = {
    pending: 0,
    inProgress: 0,
    completed: 0,
    delivered: 0
  };

  topRepairedDevices: TopRepairedDevice[] = [];
  maxRepairCount: number = 1;

  // Métricas de rendimiento
  averageRepairTime: number = 0;
  successRate: number = 0;
  customerSatisfaction: number = 4.5;

  // Actividad reciente
  recentActivities: RecentActivity[] = [];
  recentRepairs: Repair[] = [];

  // Quick stats
  pendingRepairsCount: number = 0;
  inProgressRepairsCount: number = 0;

  constructor(
    private customerService: CustomerService,
    private phoneService: PhoneService,
    private repairService: RepairService,
    private partCatalogService: PartCatalogService,
  ) {
    this.setCurrentMonth();
  }

  ngOnInit(): void {
    this.loadAllData();
  }

  private setCurrentMonth(): void {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    this.currentMonth = months[this.currentDate.getMonth()] + ' ' + this.currentDate.getFullYear();
  }

  private loadAllData(): void {
    this.isLoadingDashboard = true;

    // Cargar datos básicos de forma simultánea
    this.loadBasicStats();

    // Cargar estadísticas avanzadas
    this.loadRepairsData();
  }

  private loadBasicStats(): void {
    this.isLoadingStats = true;

    forkJoin({
      customers: this.customerService.getCountCustomers(),
      phones: this.phoneService.getCountPhones(),
      repairs: this.repairService.getCountRepairs(),
      parts: this.partCatalogService.getPartsCatalog()
    })
    .pipe(finalize(() => {
      this.isLoadingStats = false;
      this.isLoadingDashboard = false;
    }))
    .subscribe({
      next: ({ customers, phones, repairs, parts }) => {
        this.totalCustomers = customers;
        this.totalPhones = phones;
        this.totalRepairs = repairs;
        this.totalParts = parts.length;

        // Calcular datos del mes actual (simulado)
        this.newCustomersThisMonth = Math.floor(customers * 0.15);
        this.repairsThisMonth = Math.floor(repairs * 0.25);
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
      }
    });
  }

  // Métodos individuales mantenidos para compatibilidad pero ahora usan loadBasicStats()
  loadCustomerCount(): void {
    if (!this.isLoadingStats) {
      this.loadBasicStats();
    }
  }

  loadPhonesCount(): void {
    if (!this.isLoadingStats) {
      this.loadBasicStats();
    }
  }

  loadRepairsCount(): void {
    if (!this.isLoadingStats) {
      this.loadBasicStats();
    }
  }

  loadPartsCount(): void {
    if (!this.isLoadingStats) {
      this.loadBasicStats();
    }
  }

  private loadRepairsData(): void {
    this.isLoadingCharts = true;
    
    // Cargar todas las reparaciones para análisis
    forkJoin({
      repairs: this.repairService.getRepairs(),
      phones: this.phoneService.getPhones()
    })
    .pipe(finalize(() => this.isLoadingCharts = false))
    .subscribe({
      next: ({ repairs, phones }) => {
        this.analyzeRepairsData(repairs, phones);
      },
      error: (err) => {
        console.error('Error cargando datos de reparaciones:', err);
        this.isLoadingCharts = false;
      }
    });
  }

  private analyzeRepairsData(repairs: Repair[], phones: Phone[]): void {
    // Analizar reparaciones por estado
    this.repairsByStatus = {
      pending: repairs.filter(r => r.state === 'Pendiente').length,
      inProgress: repairs.filter(r => r.state === 'En Proceso').length,
      completed: repairs.filter(r => r.state === 'Completado').length,
      delivered: repairs.filter(r => r.state === 'Entregado').length
    };

    // Quick stats
    this.pendingRepairsCount = this.repairsByStatus.pending;
    this.inProgressRepairsCount = this.repairsByStatus.inProgress;

    // Get recent repairs (last 5)
    this.recentRepairs = [...repairs]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // Analizar dispositivos más reparados
    const deviceRepairCount = new Map<number, { device: any, count: number }>();

    repairs.forEach(repair => {
      const phoneId = repair.phone.id;
      if (phoneId === undefined) return;
      if (deviceRepairCount.has(phoneId)) {
        deviceRepairCount.get(phoneId)!.count++;
      } else {
        const phone = phones.find(p => p.id === phoneId);
        if (phone) {
          deviceRepairCount.set(phoneId, { device: phone, count: 1 });
        }
      }
    });

    // Convertir a array y ordenar
    this.topRepairedDevices = Array.from(deviceRepairCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => ({
        id: item.device.id,
        brand: item.device.brand,
        model: item.device.model,
        repairCount: item.count
      }));

    this.maxRepairCount = this.topRepairedDevices.length > 0
      ? this.topRepairedDevices[0].repairCount
      : 1;

    // Calcular métricas de rendimiento
    this.calculatePerformanceMetrics(repairs);

    // Generate real activity data from repairs
    this.generateRecentActivities(repairs);
  }

  private calculatePerformanceMetrics(repairs: Repair[]): void {
    if (repairs.length === 0) return;

    // Tiempo promedio de reparación (simulado)
    this.averageRepairTime = Math.floor(Math.random() * 5) + 3; // 3-7 días

    // Tasa de éxito (reparaciones completadas/entregadas vs total)
    const successfulRepairs = repairs.filter(r => 
      r.state === 'Completado' || r.state === 'Entregado'
    ).length;
    this.successRate = Math.round((successfulRepairs / repairs.length) * 100);
  }

  private generateRecentActivities(repairs: Repair[]): void {
    // Generate activities from recent repairs
    const activities: RecentActivity[] = [];

    // Get recent repairs and create activities
    const recentRepairs = [...repairs]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    recentRepairs.forEach((repair, index) => {
      // Calculate approximate timestamp based on repair date
      const repairDate = new Date(repair.date);

      let description = '';
      let type: 'repair' | 'customer' | 'device' | 'part' = 'repair';

      if (repair.state === 'Entregado') {
        description = `Reparación entregada - ${repair.phone.brand} ${repair.phone.model} (${repair.customer.name} ${repair.customer.lastname})`;
      } else if (repair.state === 'Completado') {
        description = `Reparación completada - ${repair.phone.brand} ${repair.phone.model}`;
      } else if (repair.state === 'En Proceso') {
        description = `Reparación en proceso - ${repair.phone.brand} ${repair.phone.model}`;
      } else {
        description = `Nueva reparación registrada - ${repair.phone.brand} ${repair.phone.model}`;
      }

      activities.push({
        id: repair.id!,
        type: type,
        description: description,
        timestamp: repairDate,
        entityId: repair.id,
        route: `/dashboard/repairs/edit/${repair.id}`
      });
    });

    this.recentActivities = activities.slice(0, 5);
  }

  getActivityIcon(type: string): string {
    const icons = {
      repair: '🔧',
      customer: '👤',
      device: '📱',
      part: '🔩'
    };
    return icons[type as keyof typeof icons] || '📋';
  }

  getStateColor(state: string): string {
    const colors: { [key: string]: string } = {
      'Pendiente': '#f59e0b',
      'En Proceso': '#3b82f6',
      'Completado': '#10b981',
      'Entregado': '#6366f1',
      'Cancelado': '#ef4444'
    };
    return colors[state] || '#6b7280';
  }

  getStateIcon(state: string): string {
    const icons: { [key: string]: string } = {
      'Pendiente': '⏳',
      'En Proceso': '🔧',
      'Completado': '✅',
      'Entregado': '📦',
      'Cancelado': '❌'
    };
    return icons[state] || '📋';
  }

  formatDate(date: Date | string): string {
    const now = new Date();
    const repairDate = new Date(date);
    const diffInMs = now.getTime() - repairDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Hoy';
    if (diffInDays === 1) return 'Ayer';
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    return repairDate.toLocaleDateString('es-ES');
  }
}
