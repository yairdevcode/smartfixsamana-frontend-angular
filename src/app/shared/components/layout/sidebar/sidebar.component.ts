import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit, OnDestroy {
  @ViewChild('navigation') navigation?: ElementRef<HTMLElement>;
  @ViewChild('menuToggle') menuToggle?: ElementRef<HTMLButtonElement>;
  isMobileMenuOpen = false;
  isMobile = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.onResize();
  }
  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile = window.innerWidth < 992;
    if (!this.isMobile) this.closeMobileMenu();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.isMobileMenuOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeMobileMenu();
    } else if (event.key === 'Tab') {
      const targets =
        this.navigation?.nativeElement.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        );
      if (!targets?.length) return;
      const first = targets[0],
        last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  toggleMobileMenu(): void {
    if (this.isMobileMenuOpen) {
      this.closeMobileMenu();
      return;
    }
    this.isMobileMenuOpen = true;
    document.body.style.overflow = 'hidden';
    setTimeout(() =>
      this.navigation?.nativeElement
        .querySelector<HTMLButtonElement>('.mobile-menu-close')
        ?.focus(),
    );
  }

  closeMobileMenu(): void {
    const wasOpen = this.isMobileMenuOpen;
    this.isMobileMenuOpen = false;
    document.body.style.overflow = '';
    if (wasOpen) this.menuToggle?.nativeElement.focus();
  }

  onMobileLinkClick(): void {
    if (this.isMobile) this.closeMobileMenu();
  }
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
  onLogout(): void {
    this.closeMobileMenu();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  onRegister(): void {
    this.closeMobileMenu();
    this.router.navigate(['/register']);
  }
  get isHomeActive(): boolean {
    return ['/dashboard', '/dashboard/dashboard-home'].includes(
      this.router.url.split(/[?#]/)[0],
    );
  }
  get username(): string {
    return this.authService.username;
  }
  get admin(): boolean {
    return this.authService.isAdmin();
  }
}
