import { Component, inject, DestroyRef } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, tap } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { InactivityService } from './core/services/inactivity.service';
import { AuthService } from './core/services/auth.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private updates = inject(SwUpdate);
  private inactivityService = inject(InactivityService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // Track if warning modal is currently open
  private isWarningModalOpen = false;

  ngOnInit() {
    this.setupServiceWorkerUpdates();
    this.setupInactivityTracking();
  }

  /**
   * Setup service worker update detection
   */
  private setupServiceWorkerUpdates(): void {
    if (!this.updates.isEnabled) return;

    // versionUpdates es el stream de Angular 16+
    this.updates.versionUpdates.subscribe(evt => {
      // evt.type puede ser 'VERSION_DETECTED', 'VERSION_READY', 'VERSION_INSTALLATION_FAILED', ...
      if (evt.type === 'VERSION_READY') {
        // notifica al usuario
        const proceed = confirm('Hay una nueva versión disponible. ¿Deseas actualizar ahora?');
        if (proceed) {
          this.updates.activateUpdate().then(() => document.location.reload());
        }
      }
    });
  }

  /**
   * Setup inactivity tracking and session timeout monitoring
   */
  private setupInactivityTracking(): void {
    // Subscribe to timeout warning (shows modal 2 minutes before logout)
    this.inactivityService.timeoutWarning$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.showTimeoutWarning();
      });

    // Subscribe to final timeout (logout user)
    this.inactivityService.timeout$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.handleTimeout();
      });

    // Monitor route changes to start/stop watching based on authentication and route
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        tap((event) => {
          const navigationEvent = event as NavigationEnd;
          this.handleRouteChange(navigationEvent.urlAfterRedirects);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    // Initial check on app load
    const currentUrl = this.router.url;
    this.handleRouteChange(currentUrl);
  }

  /**
   * Handle route changes - start or stop inactivity tracking
   */
  private handleRouteChange(url: string): void {
    const isAuthenticated = this.authService.isLoggedIn();
    const isPublic = this.isPublicRoute(url);

    if (isAuthenticated && !isPublic) {
      // User is logged in and on a protected page - start watching
      if (!this.inactivityService.isCurrentlyWatching()) {
        this.inactivityService.startWatching();
      }
    } else {
      // User is not logged in or on a public page - stop watching
      if (this.inactivityService.isCurrentlyWatching()) {
        this.inactivityService.stopWatching();
      }
    }
  }

  /**
   * Check if the route is a public route (no authentication required)
   */
  private isPublicRoute(url: string): boolean {
    const publicRoutes = ['/login', '/register', '/403', '/404'];
    return publicRoutes.some(route => url.startsWith(route));
  }

  /**
   * Show timeout warning modal with countdown
   * Appears 2 minutes before final timeout (at 13-minute mark for 15-minute timeout)
   */
  private showTimeoutWarning(): void {
    if (this.isWarningModalOpen) {
      return; // Prevent multiple modals
    }

    this.isWarningModalOpen = true;
    const warningMinutes = environment.sessionWarningMinutes || 2;
    const warningMs = warningMinutes * 60 * 1000;

    Swal.fire({
      title: 'Sesión por expirar',
      html: `Tu sesión expirará en <strong></strong> segundos por inactividad.<br><br>¿Deseas mantener la sesión activa?`,
      icon: 'warning',
      timer: warningMs,
      timerProgressBar: true,
      showCancelButton: true,
      confirmButtonText: 'Mantener sesión activa',
      cancelButtonText: 'Cerrar sesión',
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      didOpen: () => {
        // Update countdown every second
        const htmlContainer = Swal.getHtmlContainer();
        const strong = htmlContainer?.querySelector('strong');
        if (strong) {
          const interval = setInterval(() => {
            const timeLeft = Swal.getTimerLeft();
            if (timeLeft) {
              strong.textContent = String(Math.ceil(timeLeft / 1000));
            } else {
              clearInterval(interval);
            }
          }, 100);
        }
      },
      willClose: () => {
        this.isWarningModalOpen = false;
      }
    }).then((result) => {
      this.isWarningModalOpen = false;

      if (result.isConfirmed) {
        // User clicked "Mantener sesión activa" - reset timer
        this.inactivityService.resetTimers();
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        // User clicked "Cerrar sesión" - logout immediately
        this.handleTimeout();
      }
      // If timer ran out (DismissReason.timer), do nothing here
      // The timeout$ subscription will handle it automatically
    });
  }

  /**
   * Handle session timeout - logout and redirect to login
   */
  private handleTimeout(): void {
    // Close warning modal if open
    if (this.isWarningModalOpen) {
      Swal.close();
      this.isWarningModalOpen = false;
    }

    // Stop watching
    this.inactivityService.stopWatching();

    // Logout user (clears sessionStorage)
    this.authService.logout();

    // Navigate to login with timeout query parameter
    this.router.navigate(['/login'], {
      queryParams: { timeout: 'true' }
    });

    // Show timeout notification
    Swal.fire({
      icon: 'info',
      title: 'Sesión expirada',
      text: 'Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.',
      confirmButtonText: 'Entendido'
    });
  }
}
