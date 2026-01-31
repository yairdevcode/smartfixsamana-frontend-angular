import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, forwardRef, OnInit, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, catchError, of, takeUntil } from 'rxjs';

@Component({
  selector: 'app-autocomplete',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteComponent),
      multi: true
    }
  ]
})
export class AutocompleteComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() placeholder: string = 'Buscar...';
  @Input() icon: string = '🔍';
  @Input() displayProperty: string = 'name';
  @Input() searchFunction!: (keyword: string) => any;
  @Input() formatDisplayFn!: (item: any) => string;
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() label: string = '';

  @Output() itemSelected = new EventEmitter<any>();

  searchControl = new FormControl('');
  isSearching = false;
  isDropdownOpen = false;
  searchResults: any[] = [];
  selectedItem: any = null;
  noResultsFound = false;

  private destroy$ = new Subject<void>();
  private onChange: any = () => {};
  private onTouched: any = () => {};

  ngOnInit(): void {
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((keyword: string | null) => {
          if (!keyword || keyword.trim().length < 1) {
            this.searchResults = [];
            this.noResultsFound = false;
            this.isDropdownOpen = false;
            return of({ content: [] });
          }

          this.isSearching = true;
          this.isDropdownOpen = true;

          return this.searchFunction(keyword.trim()).pipe(
            catchError((error) => {
              console.error('Search error:', error);
              return of({ content: [] });
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          this.isSearching = false;

          // Handle both paginated (content array) and non-paginated responses
          if (response && response.content) {
            this.searchResults = response.content;
          } else if (Array.isArray(response)) {
            this.searchResults = response;
          } else {
            this.searchResults = [];
          }

          this.noResultsFound = this.searchResults.length === 0 &&
                                this.searchControl.value !== null &&
                                this.searchControl.value.trim().length > 0;
        },
        error: (error) => {
          console.error('Subscription error:', error);
          this.isSearching = false;
          this.searchResults = [];
          this.noResultsFound = true;
        }
      });
  }

  selectItem(item: any): void {
    this.selectedItem = item;
    this.searchControl.setValue(this.getDisplayText(item), { emitEvent: false });
    this.isDropdownOpen = false;
    this.searchResults = [];
    this.onChange(item.id);
    this.onTouched();
    this.itemSelected.emit(item);
  }

  clearSelection(): void {
    this.selectedItem = null;
    this.searchControl.setValue('', { emitEvent: false });
    this.searchResults = [];
    this.isDropdownOpen = false;
    this.noResultsFound = false;
    this.onChange(null);
    this.onTouched();
    this.itemSelected.emit(null);
  }

  onInputFocus(): void {
    if (this.searchControl.value && this.searchControl.value.trim().length > 0) {
      this.isDropdownOpen = true;
    }
  }

  onInputBlur(): void {
    // Delay to allow clicking on dropdown items
    setTimeout(() => {
      if (!this.selectedItem && this.searchControl.value) {
        this.searchControl.setValue('', { emitEvent: false });
      }
      this.isDropdownOpen = false;
      this.onTouched();
    }, 200);
  }

  getDisplayText(item: any): string {
    if (this.formatDisplayFn) {
      return this.formatDisplayFn(item);
    }
    if (this.displayProperty && item[this.displayProperty]) {
      return item[this.displayProperty];
    }
    return item.toString();
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (value === null || value === undefined) {
      this.clearSelection();
    }
    // Value is just an ID, we can't display it without fetching the full object
    // The parent component should handle loading the full object if needed
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.searchControl.disable();
    } else {
      this.searchControl.enable();
    }
  }

  get hasSelection(): boolean {
    return this.selectedItem !== null;
  }
}
