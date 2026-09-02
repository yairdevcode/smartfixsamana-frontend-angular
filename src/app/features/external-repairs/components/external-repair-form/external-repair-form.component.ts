import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExternalRepairService } from '../../services/external-repair.service';
import { PartCatalogService } from '../../../parts/services/parts-catalog.service';
import { PhoneService } from '../../../phones/services/phone.service';
import { PartCatalogResponse } from '../../../../shared/models/part-catalog';
import { Phone } from '../../../../shared/models/phone';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { catchError, debounceTime, distinctUntilChanged, finalize, of, switchMap } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-external-repair-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, SpinnerComponent],
  templateUrl: './external-repair-form.component.html',
  styleUrl: './external-repair-form.component.css'
})
export class ExternalRepairFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private externalRepairService = inject(ExternalRepairService);
  private partCatalogService = inject(PartCatalogService);
  private phoneService = inject(PhoneService);

  private destroyRef = inject(DestroyRef);

  form!: FormGroup;
  repairId!: number;
  isEditMode = false;
  isLoading = false;
  isSubmitting = false;

  // Part selector (an external repair uses at most one catalog part)
  partSearchControl = new FormControl('');
  availableParts: PartCatalogResponse[] = [];
  isSearchingParts = false;
  showPartSelector = false;
  selectedPart: PartCatalogResponse | null = null;
  partQuantity = 1;

  // Phone suggestions for the free-text "Marca / Modelo" field
  phoneSuggestions: Phone[] = [];
  isSearchingPhones = false;
  showPhoneSuggestions = false;
  private isPhoneFieldFocused = false;

  repairStatuses = [
    { value: 'REPARADO', label: 'Reparado' },
    { value: 'ENTREGADO', label: 'Entregado' },
    { value: 'PENDIENTE_RECOGER', label: 'Pendiente Recoger' }
  ];

  ngOnInit(): void {
    this.form = this.fb.group({
      clientName: ['', Validators.required],
      phoneBrand: ['', Validators.required],
      solution: ['', Validators.required],
      repairPrice: [0, [Validators.required, Validators.min(0)]],
      partCost: [0, [Validators.min(0)]],
      status: ['REPARADO', Validators.required],
      date: ['', Validators.required],
      notes: [''],
      partCatalogId: [null],
      partQuantity: [null]
    });

    // External repairs store phoneBrand as free text and have no Phone entity,
    // so the search is never filtered by phoneId.
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
          return this.partCatalogService.searchAvailableParts(keyword).pipe(
            catchError(() => {
              this.isSearchingParts = false;
              return of([]);
            })
          );
        })
      )
      .subscribe({
        next: (parts) => {
          this.availableParts = parts;
          this.isSearchingParts = false;
        },
        error: () => {
          this.availableParts = [];
          this.isSearchingParts = false;
        }
      });

    // Suggestions only: phoneBrand stays free text, since the partner store sends
    // devices that are not in our catalog and the Excel import reconciles on the
    // exact stored string.
    this.form.get('phoneBrand')!.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((keyword: string) => {
          const term = (keyword || '').trim();
          if (term.length < 2) {
            this.phoneSuggestions = [];
            this.showPhoneSuggestions = false;
            return of(null);
          }
          this.isSearchingPhones = true;
          return this.phoneService.getPhonesPage(0, term, 8).pipe(
            // A failing lookup must never block typing in the field.
            catchError(() => of(null))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((data: any) => {
        this.isSearchingPhones = false;
        if (data) {
          this.phoneSuggestions = data.content || [];
          // A response landing after the user left the field must not reopen it.
          this.showPhoneSuggestions = this.isPhoneFieldFocused;
        }
      });

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.repairId = +idParam;
        this.isEditMode = true;
        this.loadRepairData();
      }
    });
  }

  private loadRepairData(): void {
    this.isLoading = true;
    this.externalRepairService.getById(this.repairId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (repair) => {
          this.form.patchValue({
            clientName: repair.clientName,
            solution: repair.solution,
            repairPrice: repair.repairPrice,
            partCost: repair.partCost || 0,
            status: repair.status,
            date: repair.date,
            notes: repair.notes || '',
            partCatalogId: repair.partCatalogId ?? null,
            partQuantity: repair.partQuantity ?? null
          });

          // Kept out of the patchValue above: without emitEvent: false, opening an
          // existing repair fires a search and pops the suggestion list open
          // before the user has touched anything.
          this.form.get('phoneBrand')!.setValue(repair.phoneBrand, { emitEvent: false });

          // Older records have no inventory part; leave the selector empty for those.
          if (repair.partCatalogId) {
            this.partQuantity = repair.partQuantity || 1;
            this.loadSelectedPart(repair.partCatalogId);
          }
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar los datos de la reparaci\u00f3n'
          });
        }
      });
  }

  /**
   * Fetches the currently linked part so the panel shows its live stock.
   */
  private loadSelectedPart(partCatalogId: number): void {
    this.partCatalogService.getPartCatalogById(partCatalogId)
      .pipe(catchError(() => of(null)))
      .subscribe((part) => {
        if (part) {
          this.selectedPart = part;
          this.showPartSelector = true;
        }
      });
  }

  selectPhone(phone: Phone): void {
    // emitEvent: false stops the dropdown from reopening on the value just written.
    this.form.get('phoneBrand')!.setValue(`${phone.brand} ${phone.model}`, { emitEvent: false });
    this.showPhoneSuggestions = false;
    this.phoneSuggestions = [];
  }

  onPhoneBrandFocus(): void {
    this.isPhoneFieldFocused = true;
  }

  /**
   * Closes the suggestion list on blur without ever clearing the typed text —
   * the delay lets a mousedown on a suggestion land first.
   */
  onPhoneBrandBlur(): void {
    this.isPhoneFieldFocused = false;
    setTimeout(() => this.showPhoneSuggestions = false, 200);
  }

  closePhoneSuggestions(): void {
    this.showPhoneSuggestions = false;
    this.phoneSuggestions = [];
  }

  togglePartSelector(): void {
    this.showPartSelector = !this.showPartSelector;
    if (!this.showPartSelector && !this.selectedPart) {
      this.partSearchControl.setValue('');
      this.availableParts = [];
    }
  }

  selectPart(part: PartCatalogResponse): void {
    this.selectedPart = part;
    this.partQuantity = 1;
    this.form.patchValue({
      partCatalogId: part.id,
      partQuantity: this.partQuantity,
      // purchasePrice, not salePrice: partCost is what getMyShare() reimburses.
      partCost: (part.purchasePrice ?? 0) * this.partQuantity
    });
  }

  onPartQuantityChange(): void {
    if (!this.selectedPart) return;

    if (this.partQuantity < 1) {
      this.partQuantity = 1;
    }
    if (this.partQuantity > this.selectedPart.quantity) {
      this.partQuantity = this.selectedPart.quantity;
    }

    this.form.patchValue({
      partQuantity: this.partQuantity,
      partCost: (this.selectedPart.purchasePrice ?? 0) * this.partQuantity
    });
  }

  clearSelectedPart(): void {
    this.selectedPart = null;
    this.partQuantity = 1;
    this.partSearchControl.setValue('');
    this.availableParts = [];
    this.form.patchValue({
      partCatalogId: null,
      partQuantity: null,
      partCost: 0
    });
  }

  get isPartQuantityInvalid(): boolean {
    return !!this.selectedPart && this.partQuantity > this.selectedPart.quantity;
  }

  get netProfit(): number {
    const repairPrice = this.form.get('repairPrice')?.value || 0;
    const partCost = this.form.get('partCost')?.value || 0;
    return repairPrice - partCost;
  }

  get myShare(): number {
    const partCost = this.form.get('partCost')?.value || 0;
    return (this.netProfit * 0.60) + partCost;
  }

  get storeShare(): number {
    return this.netProfit * 0.40;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(price);
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting || this.isPartQuantityInvalid) return;

    const dto = {
      ...this.form.value,
      partCatalogId: this.selectedPart ? this.selectedPart.id : null,
      partQuantity: this.selectedPart ? this.partQuantity : null
    };
    this.isSubmitting = true;

    if (this.isEditMode && this.repairId != null) {
      this.externalRepairService.update(this.repairId, dto)
        .pipe(finalize(() => this.isSubmitting = false))
        .subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Reparaci\u00f3n actualizada',
              text: 'La reparaci\u00f3n se ha actualizado correctamente.'
            });
            this.router.navigate(['/dashboard/external-repairs']);
          },
          error: (err) => {
            Swal.fire('Error', err?.error?.message || 'No se pudo actualizar la reparaci\u00f3n.', 'error');
          }
        });
    } else {
      this.externalRepairService.create(dto)
        .pipe(finalize(() => this.isSubmitting = false))
        .subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Reparaci\u00f3n agregada',
              text: 'La reparaci\u00f3n se ha registrado correctamente.'
            });
            this.router.navigate(['/dashboard/external-repairs']);
          },
          error: (err) => {
            Swal.fire('Error', err?.error?.message || 'No se pudo guardar la reparaci\u00f3n.', 'error');
          }
        });
    }
  }

  cancel(): void {
    this.router.navigate(['/dashboard/external-repairs']);
  }

  get todayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
