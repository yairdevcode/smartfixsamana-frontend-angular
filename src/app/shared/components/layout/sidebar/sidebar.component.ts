import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit, OnDestroy {

  constructor(private authService: AuthService, private router: Router) {}

  isSidebarCollapsed = false;
  profileMenuOpen = false;
  isMobileMenuOpen = false;
  isMobile = false;

  ngOnInit() {
    this.checkScreenSize();
  }

  ngOnDestroy() {
    // Clean up any listeners if needed
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    
    // Close mobile menu when switching to desktop
    if (!this.isMobile && this.isMobileMenuOpen) {
      this.isMobileMenuOpen = false;
    }
    
    // Reset sidebar collapse state based on screen size
    if (this.isMobile) {
      this.isSidebarCollapsed = false; // Always expanded on mobile when open
    }
  }

  toggleSidebar() {
    if (this.isMobile) {
      this.toggleMobileMenu();
    } else {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    
    // Prevent body scrolling when mobile menu is open
    if (this.isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    document.body.style.overflow = '';
  }

  onMobileLinkClick() {
    // Close mobile menu when a navigation link is clicked
    if (this.isMobile) {
      this.closeMobileMenu();
    }
  }

  toggleProfileMenu() {
    this.profileMenuOpen = !this.profileMenuOpen;
  }
  
  onLogout(): void {
    this.closeMobileMenu(); // Close mobile menu before logout
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onRegister(): void {
    this.closeMobileMenu(); // Close mobile menu before navigation
    this.router.navigate(['/register']);
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get username(): string {
    return this.authService.username;
  }

  get admin(): boolean {
    return this.authService.isAdmin();
  }

}
