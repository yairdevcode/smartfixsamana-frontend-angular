import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormControl,
  FormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RepairService } from '../../services/repair.service';
import { RepairPartService } from '../../services/repair-part.service';
import { CustomerService } from '../../../customers/services/customers.service';
import { PhoneService } from '../../../phones/services/phone.service';
import { PartCatalogService } from '../../../parts/services/parts-catalog.service';
import { Customer } from '../../../../shared/models/customer';
import { Phone } from '../../../../shared/models/phone';
import { PartCatalogResponse } from '../../../../shared/models/part-catalog';
import { RepairPart, RepairPartRequest } from '../../../../shared/models/repair-part';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { AutocompleteComponent } from '../../../../shared/components/autocomplete/autocomplete.component';
import { finalize, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-repair-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, SpinnerComponent, AutocompleteComponent],
  templateUrl: './repair-form.component.html',
  styleUrl: './repair-form.component.css',
})
export class RepairFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private repairService = inject(RepairService);
  private repairPartService = inject(RepairPartService);
  private customerService = inject(CustomerService);
  private phoneService = inject(PhoneService);
  private partCatalogService = inject(PartCatalogService);

  form!: FormGroup;
  repairId!: number;
  isEditMode = false;
  isLoading = false;
  isLoadingData = false;
  isSubmitting = false;

  selectedCustomer: Customer | null = null;
  selectedPhone: Phone | null = null;

  // Parts management
  repairParts: RepairPart[] = [];
  isLoadingParts = false;
  isAddingPart = false;
  isRemovingPartId: number | null = null;

  // Part selector
  partSearchControl = new FormControl('');
  availableParts: PartCatalogResponse[] = [];
  isSearchingParts = false;
  showPartSelector = false;
  selectedPart: PartCatalogResponse | null = null;
  partQuantity = 1;
  partPrice: number | null = null;


  // Estados de reparación disponibles
  repairStates = [
    { value: 'Pendiente', label: 'Pendiente', color: '#f59e0b' },
    { value: 'En Proceso', label: 'En Proceso', color: '#3b82f6' },
    { value: 'Completado', label: 'Completado', color: '#10b981' },
    { value: 'Entregado', label: 'Entregado', color: '#6366f1' },
    { value: 'Cancelado', label: 'Cancelado', color: '#ef4444' }
  ];

  ngOnInit(): void {
    this.form = this.fb.group({
      customerId: [null, Validators.required],
      phoneId: [null, Validators.required],
      fault: ['', Validators.required],
      state: ['', Validators.required],
      date: ['', Validators.required],
      laborCost: [0, [Validators.min(0)]],
    });

    // Setup part search
    this.partSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((keyword) => {
          if (!keyword || keyword.length < 2) {
            this.availableParts = [];
            return of([]);
          }
          this.isSearchingParts = true;
          const phoneId = this.selectedPhone?.id;
          console.log('Searching for:', keyword, 'phoneId:', phoneId);
          return this.partCatalogService.searchAvailableParts(keyword, phoneId).pipe(
            catchError((err) => {
              console.error('Part search HTTP error:', err.status, err.message, err);
              this.isSearchingParts = false;
              return of([]);
            })
          );
        })
      )
      .subscribe({
        next: (parts) => {
          console.log('Parts received:', parts, 'count:', parts.length);
          this.availableParts = parts;
          this.isSearchingParts = false;
        },
        error: () => {
          this.availableParts = [];
          this.isSearchingParts = false;
        }
      });

    // Modo edición
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.repairId = +idParam;
        this.isEditMode = true;
        this.loadRepairData();
      }
    });
  }

  // Search function for customers autocomplete
  searchCustomers = (keyword: string) => {
    return this.customerService.getCustomersPage(0, keyword);
  };

  // Search function for phones autocomplete
  searchPhones = (keyword: string) => {
    return this.phoneService.getPhonesPage(0, keyword);
  };

  // Format display for customer
  formatCustomerDisplay = (customer: Customer) => {
    return `${customer.name} ${customer.lastname} - ${customer.phone}`;
  };

  // Format display for phone
  formatPhoneDisplay = (phone: Phone) => {
    return `${phone.brand} ${phone.model}`;
  };

  // Handle customer selection
  onCustomerSelected(customer: Customer | null): void {
    this.selectedCustomer = customer;
    this.form.patchValue({ customerId: customer?.id || null });
  }

  // Handle phone selection
  onPhoneSelected(phone: Phone | null): void {
    this.selectedPhone = phone;
    this.form.patchValue({ phoneId: phone?.id || null });
  }

  private loadRepairData(): void {
    this.isLoading = true;
    this.repairService.getRepairById(this.repairId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (repair) => {
          if (repair) {
            // Set selected items for autocomplete display
            this.selectedCustomer = repair.customer;
            this.selectedPhone = repair.phone;

            this.form.patchValue({
              customerId: repair.customer.id,
              phoneId: repair.phone.id,
              fault: repair.fault,
              state: repair.state,
              date: repair.date,
              laborCost: repair.laborCost || 0,
            });

            // Load parts for this repair
            this.loadRepairParts();
          }
        },
        error: (error) => {
          console.error('Error loading repair data:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar los datos de la reparación'
          });
        }
      });
  }

  private loadRepairParts(): void {
    if (!this.repairId) return;

    this.isLoadingParts = true;
    this.repairPartService.getPartsByRepair(this.repairId)
      .pipe(finalize(() => this.isLoadingParts = false))
      .subscribe({
        next: (parts) => {
          this.repairParts = parts;
        },
        error: (err) => {
          console.error('Error loading repair parts:', err);
        }
      });
  }

  // Parts management methods
  togglePartSelector(): void {
    this.showPartSelector = !this.showPartSelector;
    if (!this.showPartSelector) {
      this.resetPartSelector();
    }
  }

  selectPart(part: PartCatalogResponse): void {
    this.selectedPart = part;
    this.partPrice = part.salePrice || 0;
    this.partQuantity = 1;
  }

  resetPartSelector(): void {
    this.selectedPart = null;
    this.partSearchControl.setValue('');
    this.availableParts = [];
    this.partQuantity = 1;
    this.partPrice = null;
  }

  addPartToRepair(): void {
    if (!this.selectedPart || !this.repairId || this.partQuantity < 1) return;

    if (this.partQuantity > this.selectedPart.quantity) {
      Swal.fire('Error', `Solo hay ${this.selectedPart.quantity} unidades disponibles.`, 'error');
      return;
    }

    this.isAddingPart = true;
    const request: RepairPartRequest = {
      partCatalogId: this.selectedPart.id,
      quantity: this.partQuantity,
      priceCharged: this.partPrice || this.selectedPart.salePrice || 0
    };

    this.repairPartService.addPartToRepair(this.repairId, request)
      .pipe(finalize(() => this.isAddingPart = false))
      .subscribe({
        next: () => {
          Swal.fire('Agregado', 'El repuesto ha sido agregado a la reparación.', 'success');
          this.loadRepairParts();
          this.resetPartSelector();
          this.showPartSelector = false;
        },
        error: (err) => {
          const message = err?.error?.message || 'No se pudo agregar el repuesto.';
          Swal.fire('Error', message, 'error');
        }
      });
  }

  removePartFromRepair(part: RepairPart): void {
    if (!part.id || !this.repairId) return;

    Swal.fire({
      title: '¿Eliminar repuesto?',
      text: `¿Deseas eliminar "${part.partCatalogName}" de esta reparación?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isRemovingPartId = part.id!;
        this.repairPartService.removePartFromRepair(this.repairId, part.id!)
          .pipe(finalize(() => this.isRemovingPartId = null))
          .subscribe({
            next: () => {
              Swal.fire('Eliminado', 'El repuesto ha sido eliminado.', 'success');
              this.loadRepairParts();
            },
            error: () => {
              Swal.fire('Error', 'No se pudo eliminar el repuesto.', 'error');
            }
          });
      }
    });
  }

  // Cost calculations
  get totalPartsCost(): number {
    return this.repairParts.reduce((sum, part) => sum + (part.priceCharged * part.quantity), 0);
  }

  get totalCost(): number {
    return this.totalPartsCost + (this.form.get('laborCost')?.value || 0);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(price);
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) return;

    const repairDto = this.form.value;
    this.isSubmitting = true;

    if (this.isEditMode && this.repairId != null) {
      this.repairService
        .updateRepair(this.repairId, repairDto)
        .pipe(finalize(() => this.isSubmitting = false))
        .subscribe(() => {
          Swal.fire({
            icon: 'success',
            title: 'Reparación actualizada',
            text: 'La reparación se ha actualizado correctamente.',
          });
          this.router.navigate(['/dashboard/repairs']);
        });
    } else {
      this.repairService.createRepair(repairDto)
        .pipe(finalize(() => this.isSubmitting = false))
        .subscribe(() => {
          Swal.fire({
            icon: 'success',
            title: 'Reparación agregada',
            text: 'La reparación se ha agregado correctamente.',
          });
          this.router.navigate(['/dashboard/repairs']);
        });
    }
  }

  cancel(): void {
    this.router.navigate(['/dashboard/repairs']);
  }

  // Métodos helper para el template
  getSelectedCustomer(): Customer | null {
    return this.selectedCustomer;
  }

  getSelectedPhone(): Phone | null {
    return this.selectedPhone;
  }

  getSelectedState(): any {
    const state = this.form.get('state')?.value;
    return this.repairStates.find((s) => s.value === state);
  }

  get isFormReady(): boolean {
    return !this.isLoadingData && !this.isLoading;
  }

  get todayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
