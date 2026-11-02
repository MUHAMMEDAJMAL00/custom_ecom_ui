# Platform UI

Angular 19 workspace for the multi-tenant e-commerce platform.

Two applications:

| Project | Purpose | Dev URL |
|---|---|---|
| `admin` | Super Admin console (`/platform/*`) and later the Tenant Admin (`/*`) | `http://localhost:4200` |
| `storefront` | Public storefront served per tenant | `http://localhost:4300` |

## Current status

Phase 2 — Super Admin login and shell are built.

Implemented in `admin`:

- Platform login with validation, error states, and show/hide password.
- Audience-scoped JWT storage and auth interceptor.
- Auth and guest guards.
- Responsive shell: sidebar, header, mobile drawer.
- Dashboard with real `/api/v1/platform/dashboard` data.
- Tenant list with search, status filter, and pagination.
- Create Tenant wizard with profile, design/theme preview, modules, owner, route, review, provisioning result, and retry.
- Tenant Admin login at `/t/:slug/login` and a shop dashboard with enabled modules and password change.
- Not-found screen.

Not built yet:

- Tenant detail, modules, domains, platform users, audit log.
- Tenant Admin catalog, orders, settings, and website screens.
- Storefront screens.

## Run locally

### 1. Start the API

```bash
cd ../platform-api
npm install
npm run migrate
npm run catalogue:sync
npm run dev
```

The API runs at `http://localhost:5100`. Check `http://localhost:5100/health`.

### 2. Start the admin app

```bash
npm install
npm run start:admin
```

If port 4200 is busy:

```bash
npm run start:admin -- --port 4210
```

Open `http://localhost:4200/platform/login`.

### Local tenant login

A tenant is reached by its slug in development:

```text
http://localhost:4200/login?tenant=<slug>
http://localhost:4200/t/<slug>/login
```

Example: `http://localhost:4200/login?tenant=beauty-glow`

Use the shop owner's username and the temporary password set in the Create Tenant wizard.

### Local storefront

```text
http://localhost:4300/?tenant=<slug>
```

Example: `http://localhost:4300/?tenant=beauty-glow`

### Domains

Open **Platform → Tenants → Domains** to add and verify a custom domain. DNS and SSL still have to be configured at the deployment level; the screen tracks the mapping and verification.

### Local login

A local platform owner was created for development:

```text
Email:    admin@example.com
Password: Platform@12345
```

These credentials are for local development only. Change or remove them before any shared deployment.

## API base URL

- Development: `http://localhost:5100/api/v1` (`src/environments/environment.ts`)
- Production: `/api/v1` (`src/environments/environment.production.ts`, applied by `angular.json` file replacement)

## Structure

```text
projects/admin/src/app/
  core/
    guards/          auth + guest guards
    interceptors/    JWT header and 401 handling
    models/          API, auth, dashboard, tenant types
    services/        API client, auth state, token storage
    utils/           status labels and initials
  features/
    auth/login/      platform sign-in
    dashboard/       KPI dashboard
    tenants/         tenant list
    not-found/
  layout/
    shell/           app shell
    sidebar/         platform navigation
    header/          page title, user, sign out
```

## Build

```bash
npm run build:admin
npm run build:storefront
```

## Next screen

Create Tenant wizard at `/platform/tenants/new`:

1. Profile
2. Design and theme
3. Modules
4. Owner
5. Route
6. Review and provision
