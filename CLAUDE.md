# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SmartFix Samana is a phone repair shop management system built with Angular 17. The application manages customers, phones, repairs, and parts inventory with JWT-based authentication.

## Development Commands

### Starting Development
```bash
ng serve                          # Start dev server on http://localhost:4200/
npm start                         # Alternative to ng serve
```

### Building
```bash
ng build --project smartfix-samana              # Production build
ng build --project smartfix-samana --configuration development  # Development build
ng build --watch --configuration development    # Watch mode for development
```

### Testing
```bash
ng test                          # Run unit tests via Karma
```

### Code Generation
```bash
ng generate component component-name           # Generate new component
ng generate service service-name              # Generate new service
ng generate guard guard-name                  # Generate new guard
```

## Architecture

### Project Structure

The application follows Angular's feature-based architecture:

- **Core Module** (`src/app/core/`): Singleton services and app-wide functionality
  - `guards/`: Route guards (e.g., authGuard for protected routes)
  - `interceptors/`: HTTP interceptors (e.g., tokenInterceptor for JWT)
  - `services/`: Core services like AuthService

- **Features** (`src/app/features/`): Business domain modules
  - `auth/`: Login and registration
  - `customers/`: Customer management
  - `phones/`: Phone catalog management
  - `repairs/`: Repair tracking and management
  - `parts/`: Parts inventory and catalog

- **Shared Module** (`src/app/shared/`): Reusable components and utilities
  - `components/`: Shared UI components (pagination, layout, spinner)
  - `models/`: TypeScript interfaces and classes for domain models
  - `pages/`: Error pages (404, 403)

### Key Architectural Patterns

#### Standalone Components
This project uses Angular 17's standalone components (no NgModules). All components are standalone and import their dependencies directly.

#### Lazy Loading
Features are lazy-loaded using route configuration:
```typescript
{
  path: 'customers',
  loadChildren: () => import('./features/customers/customers.routes').then(m => m.customersRoutes)
}
```

#### Authentication Flow
1. User logs in via LoginComponent
2. AuthService stores JWT token, username, and admin status in sessionStorage
3. tokenInterceptor automatically adds `Authorization: Bearer <token>` header to all HTTP requests
4. authGuard protects routes requiring authentication
5. Unauthenticated users are redirected to `/login`

#### Service Layer Pattern
Each feature has its own service (e.g., CustomerService, RepairService) that:
- Communicates with the backend API via HttpClient
- Uses environment.apiUrl for base URL configuration
- Returns Observables for async operations
- Handles pagination with search parameters

### Backend Integration

- **API Base URL**: `http://localhost:8080` (development)
- **Proxy Configuration**: `/api` requests are proxied to backend (see proxy.conf.json)
- **Environment Files**:
  - `src/environments/environment.ts` (development)
  - `src/environments/environment.prod.ts` (production, file replacement configured)

### Data Models

Core domain models in `src/app/shared/models/`:
- **Customer**: id, name, lastname, phone, email
- **Phone**: Phone catalog/inventory
- **Repair**: Links Customer + Phone with fault, state, and date
- **Part**: Repair parts inventory
- **UserLogin**: Authentication user model

### Shared Components

#### Pagination Component
Located at `src/app/shared/components/pagination/`, provides icon-based navigation:
- First page (⏮️), Previous (◀️), Next (▶️), Last page (⏭️)
- Displays "Page X of Y"
- Responsive design for mobile
- Used by all list components (customers-list, phone-list, part-list, repair-list)

#### Dashboard Layout
Main authenticated layout with sidebar navigation located at `src/app/shared/components/layout/dashboard/`

### Localization
- **Default Locale**: Spanish (`es`)
- Configured in app.config.ts with `LOCALE_ID` provider

### PWA Support
- Service worker enabled for production builds
- Configuration in `ngsw-config.json`
- Registered with 30-second delay after app stabilizes

### External Libraries
- **SweetAlert2**: Used for alerts and confirmations (configured in angular.json allowedCommonJsDependencies)

## CI/CD and Deployment

### GitHub Actions Workflows

The project uses three GitHub Actions workflows:

#### 1. Production Deployment (`.github/workflows/deploy-frontend.yml`)
- **Trigger**: Push to `main` or `master` branch
- **Process**:
  - Runs linter and full test suite with coverage
  - Builds production Angular PWA with `--configuration production`
  - Creates Docker image with multi-stage build (node:20-alpine → nginx:alpine)
  - Pushes to Docker Hub with tags: `ss-frontend`, `ss-frontend-{sha}`, `ss-frontend-latest`
  - SSHs to EC2 and deploys via docker-compose
  - Performs health checks and verification
- **Features**: Build caching, test coverage artifacts, deployment notifications

#### 2. Staging Deployment (`.github/workflows/deploy-staging.yml`)
- **Trigger**: Push to `develop` or `staging` branch, or manual dispatch
- **Process**: Similar to production but uses development configuration
- **Target**: Staging EC2 environment (separate from production)

#### 3. Pull Request Checks (`.github/workflows/pr-checks.yml`)
- **Trigger**: PRs to `main`, `master`, `develop`, or `staging`
- **Process**:
  - Lint and test validation
  - Build verification for both development and production
  - Docker build check (no push)
  - Security audit with npm audit
  - Bundle size reporting
- **No deployment** - only validates changes

### Required GitHub Secrets

Configure in repository Settings → Secrets:
- `DOCKER_USERNAME`: Docker Hub username
- `DOCKER_PASSWORD`: Docker Hub access token
- `EC2_HOST`: Production EC2 IP/hostname
- `EC2_USERNAME`: SSH username (typically `ubuntu`)
- `EC2_SSH_KEY`: Private SSH key for EC2 access
- `EC2_STAGING_HOST`: Staging EC2 IP (optional)

### Docker Configuration

**Dockerfile**: Multi-stage build
1. Stage 1: Build Angular app with node:20-alpine
2. Stage 2: Serve with nginx:alpine
3. Output path: `/usr/share/nginx/html` contains `dist/smartfix-samana/browser/`

**nginx.conf**:
- Configures SPA routing (all routes → index.html)
- PWA-specific caching (service worker files never cached)
- Proxies `/api/*` requests to backend container `app_smartfixsamana:8080`
- CORS headers for development
- Security headers for production

### Deployment Architecture on EC2

The application deploys as a multi-container stack using docker-compose:

```
Docker Network (smartfix-network)
├── frontend (nginx:80) → SmartFix Angular PWA
│   └── Proxies /api/* to backend
├── app_smartfixsamana (Spring Boot:8080) → Backend API
│   └── Connects to database
└── db (MySQL:3306) → Database
```

**Example Files**:
- `docker-compose.example.yml`: Production orchestration template
- `docker-compose.staging.example.yml`: Staging orchestration template
- `.env.ec2.example`: Environment variables template for EC2

### Deployment Commands

For detailed deployment instructions, see `DEPLOYMENT.md`.

**Quick commands**:
```bash
# Manual local build and push
docker build -t username/smartfix-samana:ss-frontend .
docker push username/smartfix-samana:ss-frontend

# EC2 deployment commands (via SSH)
cd /home/ubuntu/smartfix-samana
docker pull username/smartfix-samana:ss-frontend
docker-compose down
docker-compose up -d

# View logs
docker-compose logs -f frontend
docker-compose ps
```

### Build Performance

- **npm caching**: Node modules cached between workflow runs
- **Docker layer caching**: BuildKit caching reduces build time by 50-70%
- **Test artifacts**: Coverage reports retained for 30 days
- **Build artifacts**: Dist files retained for 7 days

## Important Notes

- The project name in angular.json is `smartfix-samana` (must be specified in build commands)
- Authentication state persists in sessionStorage (not localStorage)
- Admin privileges are tracked separately from authentication status
- All HTTP requests automatically include JWT token via interceptor (except login/register)
- Routes are protected by authGuard - unauthenticated users redirected to `/login`
- Backend container must be named `app_smartfixsamana` in docker-compose for nginx proxy to work
- Service worker files (`ngsw.json`, `ngsw-worker.js`) must never be cached
