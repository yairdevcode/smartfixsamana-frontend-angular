import { Injectable, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, merge, Subject, Subscription, timer } from 'rxjs';
import { debounceTime, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Configuration interface for inactivity timeout settings
 */
export interface InactivityConfig {
  timeoutMinutes: number;
  warningMinutes: number;
}

/**
 * Service to monitor user inactivity and emit timeout events
 *
 * Usage:
 * - Call startWatching() to begin monitoring user activity
 * - Subscribe to timeoutWarning$ to show warning dialog
 * - Subscribe to timeout$ to handle session expiration
 * - Call stopWatching() to stop monitoring (e.g., on logout)
 */
@Injectable({
  providedIn: 'root'
})
export class InactivityService {
  private destroyRef = inject(DestroyRef);

  // Configuration from environment
  private config: InactivityConfig = {
    timeoutMinutes: environment.sessionTimeoutMinutes || 15,
    warningMinutes: environment.sessionWarningMinutes || 2
  };

  // Subjects for emitting timeout events
  private timeoutWarningSubject = new Subject<void>();
  private timeoutSubject = new Subject<void>();

  // Public observables for external subscription
  public readonly timeoutWarning$ = this.timeoutWarningSubject.asObservable();
  public readonly timeout$ = this.timeoutSubject.asObservable();

  // Timer subscriptions
  private warningTimer?: Subscription;
  private timeoutTimer?: Subscription;
  private activitySubscription?: Subscription;

  // Tracking state
  private isWatching = false;
  private warningShown = false;

  /**
   * Start watching for user inactivity
   * Sets up event listeners and initializes timers
   */
  startWatching(): void {
    if (this.isWatching) {
      return;
    }

    this.isWatching = true;
    this.warningShown = false;
    this.setupActivityListeners();
    this.resetTimers();
  }

  /**
   * Stop watching for user inactivity and cleanup all listeners/timers
   * Call this on logout or when navigating to public pages
   */
  stopWatching(): void {
    if (!this.isWatching) {
      return;
    }

    this.isWatching = false;
    this.warningShown = false;
    this.clearTimers();
    this.clearActivityListeners();
  }

  /**
   * Reset the inactivity timers
   * Called automatically on user activity or manually when user clicks "Stay logged in"
   */
  resetTimers(): void {
    if (!this.isWatching) {
      return;
    }

    this.warningShown = false;
    this.clearTimers();

    // Calculate timeout values in milliseconds
    const timeoutMs = this.config.timeoutMinutes * 60 * 1000;
    const warningMs = (this.config.timeoutMinutes - this.config.warningMinutes) * 60 * 1000;

    // Set warning timer (e.g., fires at 13 minutes for 15-minute timeout with 2-minute warning)
    this.warningTimer = timer(warningMs).subscribe(() => {
      if (this.isWatching && !this.warningShown) {
        this.warningShown = true;
        this.timeoutWarningSubject.next();
      }
    });

    // Set final timeout timer (e.g., fires at 15 minutes)
    this.timeoutTimer = timer(timeoutMs).subscribe(() => {
      if (this.isWatching) {
        this.timeoutSubject.next();
        this.stopWatching();
      }
    });
  }

  /**
   * Setup listeners for user activity events
   * Monitors: mouse movement, clicks, keyboard input, touch, and scroll
   */
  private setupActivityListeners(): void {
    // Monitor multiple types of user activity
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

    const activityStreams = events.map(event =>
      fromEvent(document, event)
    );

    // Merge all activity streams and debounce to avoid excessive timer resets
    this.activitySubscription = merge(...activityStreams)
      .pipe(
        debounceTime(500), // Process activity events at most once per 500ms
        tap(() => {
          // Only reset timer if warning hasn't been shown yet
          // Once warning appears, user must explicitly click a button
          if (this.isWatching && !this.warningShown) {
            this.resetTimers();
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Clear all activity event listeners
   */
  private clearActivityListeners(): void {
    if (this.activitySubscription) {
      this.activitySubscription.unsubscribe();
      this.activitySubscription = undefined;
    }
  }

  /**
   * Clear all timeout timers
   */
  private clearTimers(): void {
    if (this.warningTimer) {
      this.warningTimer.unsubscribe();
      this.warningTimer = undefined;
    }

    if (this.timeoutTimer) {
      this.timeoutTimer.unsubscribe();
      this.timeoutTimer = undefined;
    }
  }

  /**
   * Check if currently watching for inactivity
   * @returns true if service is actively monitoring user activity
   */
  isCurrentlyWatching(): boolean {
    return this.isWatching;
  }

  /**
   * Get current configuration
   * @returns Current timeout configuration
   */
  getConfig(): Readonly<InactivityConfig> {
    return { ...this.config };
  }
}
