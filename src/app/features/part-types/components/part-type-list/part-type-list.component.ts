import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { PartTypeService } from '../../services/part-type.service';
import { PartTypeResponse } from '../../../../shared/models/part-type';
import { AuthService } from '../../../../core/services/auth.service';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-part-type-list',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    ReactiveFormsModule,
    SpinnerComponent,
  ],
  templateUrl: './part-type-list.component.html',
  styleUrl: './part-type-list.component.css',
})
export class PartTypeListComponent implements OnInit {
  private partTypeService = inject(PartTypeService);
  private router = inject(Router);
  private authService = inject(AuthService);

  partTypes: PartTypeResponse[] = [];
  filteredPartTypes: PartTypeResponse[] = [];
  isLoading = false;
  isDeleting = false;

  searchControl = new FormControl('');

  ngOnInit(): void {
    this.loadPartTypes();

    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.filterPartTypes();
      });
  }

  loadPartTypes(): void {
    this.isLoading = true;
    this.partTypeService.getPartTypes()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (data) => {
          this.partTypes = data;
          this.filterPartTypes();
        },
        error: (err) => {
          console.error('Error loading part types:', err);
          Swal.fire('Error', 'No se pudieron cargar los tipos de repuesto.', 'error');
        }
      });
  }

  private filterPartTypes(): void {
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    if (!searchTerm) {
      this.filteredPartTypes = [...this.partTypes];
    } else {
      this.filteredPartTypes = this.partTypes.filter(pt =>
        pt.name.toLowerCase().includes(searchTerm) ||
        (pt.description && pt.description.toLowerCase().includes(searchTerm))
      );
    }
  }

  create(): void {
    this.router.navigate(['/dashboard/part-types/new']);
  }

  update(id: number): void {
    this.router.navigate(['/dashboard/part-types/edit', id]);
  }

  delete(partType: PartTypeResponse): void {
    if (!partType.id) return;

    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar el tipo "${partType.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.isDeleting = true;
        this.partTypeService.deletePartType(partType.id)
          .pipe(finalize(() => this.isDeleting = false))
          .subscribe({
            next: () => {
              this.loadPartTypes();
              Swal.fire('Eliminado', 'El tipo de repuesto ha sido eliminado.', 'success');
            },
            error: (err) => {
              const message = err?.error?.message || 'No se pudo eliminar. Puede estar en uso por repuestos.';
              Swal.fire('Error', message, 'error');
            }
          });
      }
    });
  }

  get admin(): boolean {
    return this.authService.isAdmin();
  }
}
