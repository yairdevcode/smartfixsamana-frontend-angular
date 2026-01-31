import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.currentPage).toBe(0);
    expect(component.totalPages).toBe(0);
  });

  it('should emit page change event when going to next page', () => {
    component.currentPage = 0;
    component.totalPages = 5;

    spyOn(component.pageChange, 'emit');

    component.goToNextPage();

    expect(component.pageChange.emit).toHaveBeenCalledWith(1);
  });

  it('should emit page change event when going to previous page', () => {
    component.currentPage = 2;
    component.totalPages = 5;

    spyOn(component.pageChange, 'emit');

    component.goToPreviousPage();

    expect(component.pageChange.emit).toHaveBeenCalledWith(1);
  });

  it('should emit page change event when going to first page', () => {
    component.currentPage = 3;
    component.totalPages = 5;

    spyOn(component.pageChange, 'emit');

    component.goToFirstPage();

    expect(component.pageChange.emit).toHaveBeenCalledWith(0);
  });

  it('should emit page change event when going to last page', () => {
    component.currentPage = 0;
    component.totalPages = 5;

    spyOn(component.pageChange, 'emit');

    component.goToLastPage();

    expect(component.pageChange.emit).toHaveBeenCalledWith(4);
  });

  it('should not go to previous page when on first page', () => {
    component.currentPage = 0;
    component.totalPages = 5;

    spyOn(component.pageChange, 'emit');

    component.goToPreviousPage();

    expect(component.pageChange.emit).not.toHaveBeenCalled();
  });

  it('should not go to next page when on last page', () => {
    component.currentPage = 4;
    component.totalPages = 5;

    spyOn(component.pageChange, 'emit');

    component.goToNextPage();

    expect(component.pageChange.emit).not.toHaveBeenCalled();
  });

  it('should calculate hasPreviousPage correctly', () => {
    component.currentPage = 0;
    expect(component.hasPreviousPage).toBe(false);

    component.currentPage = 1;
    expect(component.hasPreviousPage).toBe(true);
  });

  it('should calculate hasNextPage correctly', () => {
    component.currentPage = 0;
    component.totalPages = 5;
    expect(component.hasNextPage).toBe(true);

    component.currentPage = 4;
    expect(component.hasNextPage).toBe(false);
  });

  it('should display page number correctly (1-indexed)', () => {
    component.currentPage = 0;
    expect(component.displayPageNumber).toBe(1);

    component.currentPage = 4;
    expect(component.displayPageNumber).toBe(5);
  });
});
