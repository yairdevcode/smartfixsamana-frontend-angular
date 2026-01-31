import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { SwUpdate } from '@angular/service-worker';
import { NEVER } from 'rxjs';

import { AuthService } from './core/services/auth.service';
import { InactivityService } from './core/services/inactivity.service';

describe('AppComponent', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let inactivityServiceSpy: jasmine.SpyObj<InactivityService>;
  let swUpdateSpy: jasmine.SpyObj<SwUpdate>;

  beforeEach(async () => {
    // Create spy objects for all injected services
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'logout']);
    authServiceSpy.isLoggedIn.and.returnValue(false); // Default: not logged in

    inactivityServiceSpy = jasmine.createSpyObj('InactivityService',
      ['startWatching', 'stopWatching', 'isCurrentlyWatching', 'resetTimers', 'getConfig'],
      {
        timeoutWarning$: NEVER,  // Observable that never emits
        timeout$: NEVER          // Observable that never emits
      });
    inactivityServiceSpy.isCurrentlyWatching.and.returnValue(false);

    swUpdateSpy = jasmine.createSpyObj('SwUpdate', ['activateUpdate'], {
      isEnabled: false,          // Service worker disabled in tests
      versionUpdates: NEVER      // Observable that never emits
    });

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),  // Provides HttpClient for AuthService
        { provide: AuthService, useValue: authServiceSpy },
        { provide: InactivityService, useValue: inactivityServiceSpy },
        { provide: SwUpdate, useValue: swUpdateSpy }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have RouterOutlet', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
