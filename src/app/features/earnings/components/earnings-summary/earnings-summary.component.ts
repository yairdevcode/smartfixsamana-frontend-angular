import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { EarningsService } from '../../services/earnings.service';
import {
  DailyEarnings,
  EarningsSummary,
} from '../../../../shared/models/earnings';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-earnings-summary',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent],
  templateUrl: './earnings-summary.component.html',
  styleUrl: './earnings-summary.component.css',
})
export class EarningsSummaryComponent implements OnInit {
  private authService = inject(AuthService);

  private earningsService = inject(EarningsService);

  summary: EarningsSummary | null = null;
  isLoading = true;

  selectedDate: string = '';
  customDayEarnings: DailyEarnings | null = null;
  isLoadingCustomDay = false;

  ngOnInit(): void {
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.earningsService.getSummary().subscribe({
      next: (data) => {
        this.summary = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  onDateChange(): void {
    if (!this.selectedDate) return;
    this.isLoadingCustomDay = true;
    this.customDayEarnings = null;
    this.earningsService.getDaily(this.selectedDate).subscribe({
      next: (data) => {
        this.customDayEarnings = data;
        this.isLoadingCustomDay = false;
      },
      error: () => {
        this.isLoadingCustomDay = false;
      },
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
    }).format(price);
  }
  get admin(): boolean {
    return this.authService.isAdmin();
  }
}
