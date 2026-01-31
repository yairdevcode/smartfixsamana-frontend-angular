import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpinnerComponent } from './spinner.component';

describe('SpinnerComponent', () => {
  let component: SpinnerComponent;
  let fixture: ComponentFixture<SpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpinnerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default size as medium', () => {
    expect(component.size).toBe('medium');
  });

  it('should have default color as primary', () => {
    expect(component.color).toBe('primary');
  });

  it('should have overlay disabled by default', () => {
    expect(component.overlay).toBe(false);
  });

  it('should have default message', () => {
    expect(component.message).toBe('Cargando...');
  });

  it('should show message by default', () => {
    expect(component.showMessage).toBe(true);
  });

  it('should accept custom size input', () => {
    component.size = 'large';
    fixture.detectChanges();
    expect(component.size).toBe('large');
  });

  it('should accept custom color input', () => {
    component.color = 'secondary';
    fixture.detectChanges();
    expect(component.color).toBe('secondary');
  });
});
