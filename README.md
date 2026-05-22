# CountPos

**CountPos** is a production-oriented, cloud-based **multi-tenant SaaS POS platform** for grocery stores, pharmacies, hardware stores, supermarkets, mini marts, and general retail shops.

Each business (company) gets an **isolated workspace** with strict tenant isolation. Admins manage the store; staff run daily POS operations.

---

## Table of contents

- [Core product idea](#core-product-idea)
- [Target businesses](#target-businesses)
- [Roles & permissions](#roles--permissions)
- [Main business flow](#main-business-flow)
- [POS workflow (MVP)](#pos-workflow-mvp)
- [Payments (current scope)](#payments-current-scope)
- [Tech stack](#tech-stack)
- [System architecture](#system-architecture)
- [Repository structure](#repository-structure)
- [Multi-tenant rules](#multi-tenant-rules)
- [Feature overview](#feature-overview)
- [Database design](#database-design)
- [API overview](#api-overview)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Development scripts](#development-scripts)
- [Theming](#theming)
- [CSV import / export](#csv-import--export)
- [Profit & credit accounting](#profit--credit-accounting)
- [Build phases](#build-phases)
- [Code quality standards](#code-quality-standards)
- [Security](#security)
- [Roadmap & future payments](#roadmap--future-payments)
- [License](#license)

---

## Core product idea

CountPos is a **multi-company POS platform**:

- One deployment serves many businesses.
- Each company’s data is **scoped by `companyId`** — no cross-tenant access.
- Supports **cash** and **credit** billing only (no Stripe/gateways in current scope).
- Designed so **card/online payments** can be added later without major refactors.

### Target businesses

| Segment | Use case |
|---------|----------|
| Grocery stores | Fast checkout, expiry, low-stock alerts |
| Pharmacies | Batch/expiry, regulated inventory |
| Hardware stores | SKU/barcode, supplier tracking |
| Supermarkets | High volume, category reports |
| Mini marts | Simple POS + credit customers |
| General retail | Flexible catalog + billing |

---

## Roles & permissions

Each company has two operational groups:

### Admin (Owner / Manager / Admin)

- Register and configure the company
- Manage store profile, settings, tax
- Create and manage staff
- Full product, category, supplier control
- Approve/reject staff-created products
- Set per-product discount limits
- Inventory, stock adjustments, alerts
- Dashboard, profit, reports, exports
- Customer credit oversight
- Audit logs and notifications

### Staff (Cashier / Staff / Manager where allowed)

- Login to **assigned company only**
- POS billing: search, barcode, cart, checkout
- Create products → **PENDING_APPROVAL** until admin approves
- Cash and credit sales (within discount rules)
- Limited inventory/report access per permissions

**Roles (RBAC):** `OWNER`, `ADMIN`, `MANAGER`, `CASHIER`, `STAFF`  
JWT + refresh tokens, global auth guard, `@Roles()` on sensitive routes.

---

## Main business flow

```
Admin registers company
    → Admin logs in
    → Configures store profile & settings
    → Creates staff accounts + permissions
    → Manages catalog (products, categories, suppliers)
    → Sets discount limits per product
    → Monitors dashboard & reports

Staff logs in
    → Uses POS billing
    → May add products (pending approval)
    → Sells via cash or credit
    → Stock & profit update automatically
```

---

## POS workflow (MVP)

End-to-end example:

```
1. Admin registers company
2. Admin login
3. Admin creates staff users
4. Staff login
5. Staff adds new product → status PENDING_APPROVAL
6. Admin receives notification
7. Admin reviews → approves or rejects
8. Product becomes ACTIVE → visible in POS
9. Staff opens billing screen
10. Search / scan barcode → add to cart
11. Adjust quantity, apply discount (within limit)
12. Select customer (required for credit)
13. Complete sale → invoice created
14. Stock reduced automatically
15. Profit & dashboard metrics update
16. Audit log recorded
```

**Held invoices:** Cart can be held and resumed later (`POST /invoices/hold`, `POST /invoices/held/:id/resume`).

---

## Payments (current scope)

**Not in scope:** Stripe, PayPal, or other online payment gateways.

### Supported methods

| Method | Behavior |
|--------|----------|
| **Cash** | Immediate payment; invoice `PAID`; received amount, change, timestamp |
| **Credit** | Customer required; invoice `PENDING`; outstanding balance; partial payments & settle later |

### Payment statuses

`PAID` · `PENDING` · `PARTIALLY_PAID` · `CANCELLED`

### Design note (future-ready)

Payment logic lives in **invoice/payment services**, separate from catalog and inventory. Adding card/wallet providers later means new payment adapters + methods — not rewriting core invoice or stock flows.

### Credit vs cash in metrics

- **Credit sales** do not count as **received cash** until collected.
- Dashboard separates: sales, profit, received cash, pending credit.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, next-themes |
| **Backend** | NestJS 11, TypeScript, Prisma ORM 7 |
| **Database** | PostgreSQL 16 ([Neon](https://neon.tech) recommended) |
| **Auth** | JWT access + refresh (httpOnly cookies), Passport |
| **Realtime** | Socket.IO / WebSockets (notifications) |
| **Utilities** | CSV import/export, PDF invoices (planned/ongoing), barcode support |

All API routes are prefixed with **`/api/v1`**.

---

## System architecture

### Request flow (backend)

```
HTTP Request
  → Middleware / Guards (JWT, RBAC)
  → Controller (routes, status, cookies, parsing only)
  → Service(s) (business logic)
  → Prisma → PostgreSQL (Neon)
```

**Rules:**

- DTO validation (`class-validator`)
- Thin controllers — **no business logic in controllers**
- Action-based services (e.g. `create-product.service.ts`, `approve-product.service.ts`)
- Global exception filter + response interceptor
- Reusable guards, decorators, pipes

### Spec vs repo folder names

| Specification | This repository |
|---------------|-----------------|
| `server/` | `backend/` |
| `client/` | `frontend/` |

Behavior and architecture match the spec; only directory names differ.

---

## Repository structure

```
CountPos/
├── README.md
├── backend/                          # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── controllers/              # HTTP layer only
│       │   ├── auth/
│       │   ├── companies/
│       │   ├── users/
│       │   ├── products/
│       │   ├── categories/
│       │   ├── suppliers/
│       │   ├── customers/
│       │   ├── invoices/
│       │   ├── inventory/
│       │   ├── reports/
│       │   ├── dashboard/
│       │   └── notifications/
│       ├── services/                 # Business logic (action-based)
│       │   ├── auth/
│       │   ├── products/
│       │   ├── invoices/
│       │   ├── users/
│       │   └── ...
│       ├── dtos/
│       ├── guards/
│       ├── decorators/
│       ├── common/
│       ├── config/
│       ├── prisma/
│       └── types/
│
└── frontend/                         # Next.js dashboard & POS
    ├── app/
    │   ├── login/
    │   ├── register/
    │   └── (dashboard)/
    │       ├── dashboard/
    │       ├── products/
    │       ├── product-approval/
    │       ├── billing/              # POS
    │       ├── invoices/
    │       ├── inventory/
    │       ├── customers/
    │       ├── suppliers/
    │       ├── staff/
    │       ├── reports/
    │       └── settings/
    ├── components/
    ├── src/
    │   ├── lib/                      # API client, utils
    │   ├── providers/                # Auth, theme
    │   └── ...
    └── public/
```

### Service pattern (example: products)

```
services/products/
  create-product.service.ts
  approve-product.service.ts
  reject-product.service.ts
  update-product.service.ts
  delete-product.service.ts
  get-products.service.ts
  import-products-csv.service.ts
```

---

## Multi-tenant rules

**Mandatory — every query is company-scoped.**

- JWT payload includes `companyId` (and user id, role).
- All Prisma reads/writes filter by `companyId` from the authenticated user.
- No endpoint returns another tenant’s products, invoices, customers, etc.
- Registration creates a new `Company` + owner `User` in one transaction.

**Failure mode:** Missing or mismatched tenant context → `403 Forbidden`, not empty cross-tenant data.

---

## Feature overview

### Company management

- Company profile (name, contact, address, logo)
- `CompanySettings` — tax, branding, operational prefs
- Audit logs for sensitive changes

### User management

- Create / edit / disable staff
- Roles + granular `UserPermission` flags
- Staff tied to single company

### Product management

| Creator | Initial status |
|---------|----------------|
| Admin / Owner | Active immediately |
| Staff | `PENDING_APPROVAL` — hidden from POS until approved |

**Product fields include:**

- Basic: name, SKU, barcode, category, supplier, brand, description, unit
- Pricing: cost, selling price, profit, margin %
- Discount: enabled flag, max % and max fixed amount
- Inventory: opening/current stock, reorder level, low-stock threshold, shelf/row/rack
- Expiry: expiry date, batch number
- Status: `ACTIVE`, `PENDING_APPROVAL`, `REJECTED`, `DISCONTINUED`, `OUT_OF_STOCK`

**Approval:** Admin approve / reject / edit; `ProductApprovalLog`; notifications to admin.

### Discount rules

- Per-product max discount (% and/or fixed)
- Staff cannot exceed limits (server-side validation)
- Architecture ready for admin override later

### Customer management

- CRUD, search, purchase history
- Credit balance & settlement (`settle-credit`)
- Notes

### POS billing

- Fast search + barcode (`GET /products/pos-search`)
- Cart: qty, remove, clear
- Hold / resume invoice
- Cash vs credit checkout
- Discount + tax + totals
- Invoice PDF / print (as implemented)

### Inventory

- Logs: stock in/out, adjustment, damaged, expired, lost, return, sale
- `StockAdjustment` records
- Alerts: low stock, out of stock, near expiry
- **On invoice complete → stock decreases automatically**

### Dashboard

Summary cards, trends, top products, recent invoices, notifications, filters (today / week / month / year / custom).

### Reports

Sales, products, staff performance, credit customers — CSV export where implemented.

### Notifications

Low stock, approval requests, invoice events, credit due, expiry — WebSocket + REST.

### Audit logs

Login, stock, approvals, invoices, settings, user actions — `AuditLog` model.

---

## Database design

Normalized **Prisma** schema on **PostgreSQL** (Neon-compatible).

### Core models

| Model | Purpose |
|-------|---------|
| `Company` | Tenant root |
| `CompanySettings` | Tax, branding, config |
| `User` | Staff & admins per company |
| `UserPermission` | Fine-grained flags |
| `RefreshToken` | Auth sessions |
| `Category` | Product categories |
| `Supplier` | Vendors |
| `Product` | Catalog + approval + discount + shelf fields |
| `ProductApprovalLog` | Approval history |
| `Customer` | Buyers + credit balance |
| `Invoice` / `InvoiceItem` | Sales |
| `Payment` | Cash/credit payments |
| `CustomerCreditTransaction` | Credit ledger |
| `HeldInvoice` | Suspended carts |
| `InventoryLog` | Stock movement |
| `StockAdjustment` | Manual adjustments |
| `AuditLog` | Compliance trail |
| `Notification` | In-app alerts |

### Product highlights (schema)

- `shelfNumber`, `shelfRow`, `rackNumber`
- `discountEnabled`, `maxDiscountPercentage`, `maxDiscountAmount`
- `approvalStatus`, `createdById`, `approvedById`, `approvedAt`

See [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) for the full schema.

---

## API overview

Base URL: `http://localhost:3001/api/v1` (dev)

| Module | Prefix | Examples |
|--------|--------|----------|
| Auth | `/auth` | `POST register`, `login`, `refresh`, `logout`, `GET me` |
| Companies | `/companies` | `profile`, `settings`, `audit-logs` |
| Users | `/users` | Staff CRUD |
| Products | `/products` | CRUD, `pos-search`, `pending-approvals`, `approve`, `reject`, `import/csv` |
| Categories | `/categories` | CRUD |
| Suppliers | `/suppliers` | CRUD |
| Customers | `/customers` | CRUD, `settle-credit` |
| Invoices | `/invoices` | Create, list, hold, resume, `pay-credit` |
| Inventory | `/inventory` | `adjust`, `logs`, `alerts` |
| Dashboard | `/dashboard` | `summary`, `sales-trend`, `top-products`, … |
| Reports | `/reports` | `sales`, `products`, `staff-performance`, `export/sales` |
| Notifications | `/notifications` | List, mark read, unread count |

Protected routes require valid JWT (cookie or bearer, depending on client setup). Public routes use `@Public()` decorator.

---

## Getting started

### Prerequisites

- **Node.js** 20+
- **npm**
- **PostgreSQL 16** — [Neon](https://neon.tech) project recommended
- Git

### 1. Clone the repository

```bash
git clone https://github.com/m-asjedh/CountPos.git
cd CountPos
```

### 2. Database (Neon)

1. Create a Neon project and database.
2. Copy the **pooled** connection string.
3. Use it as `DATABASE_URL` in the backend env file.

### 3. Backend setup

```bash
cd backend
npm install
cp .env.example .env   # then edit values
npx prisma migrate deploy
npx prisma generate
npm run start:dev
```

API runs at **`http://localhost:3001/api/v1`**.

### 4. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env.local   # optional if using defaults
npm run dev
```

App runs at **`http://localhost:3000`**.

### 5. First MVP test

1. Open `/register` → register a company (creates owner account).
2. Login as admin → `/dashboard`.
3. **Staff** → create a user with `CASHIER` or `STAFF` role.
4. Login as staff → add a product → verify **pending approval**.
5. Login as admin → **Product approval** → approve.
6. Staff → **Billing** → complete a cash sale.
7. Confirm invoice, stock reduction, and dashboard updates.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon/PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Yes (prod) | Access token secret |
| `JWT_REFRESH_SECRET` | Yes (prod) | Refresh token secret |
| `JWT_ACCESS_EXPIRY` | No | Default `15m` |
| `JWT_REFRESH_EXPIRY` | No | Default `7d` |
| `FRONTEND_URL` | No | CORS origin — default `http://localhost:3000` |
| `PORT` | No | API port — default `3001` |
| `NODE_ENV` | No | `development` / `production` |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | No | Default `http://localhost:3001/api/v1` |

See [`.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example).

---

## Development scripts

### Backend (`backend/`)

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Dev server with hot reload |
| `npm run build` | Compile for production |
| `npm run start:prod` | Run compiled `dist/main` |
| `npm test` | Unit tests |
| `npx prisma migrate dev` | Create/apply migrations (dev) |
| `npx prisma studio` | DB GUI |

### Frontend (`frontend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |

---

## Theming

CountPos supports **light**, **dark**, and **system** themes.

- **Tailwind** `dark:` variant + shadcn semantic tokens (`bg-background`, `text-foreground`, etc.)
- **next-themes** via `ThemeProvider` — preference persisted in browser
- No hardcoded colors in UI components; all surfaces use design tokens

Toggle is available in the dashboard layout.

---

## CSV import / export

**Import** (`POST /api/v1/products/import/csv`):

Supported columns include:

- Product Name, SKU, Barcode, Category, Supplier  
- Cost Price, Selling Price, Stock Quantity, Reorder Level  
- Unit, Expiry Date, Shelf Number, Shelf Row  

**Export:** Sales and report exports via reports module (`GET /reports/export/sales`).

---

## Profit & credit accounting

| Metric | Rule |
|--------|------|
| Item profit | Selling price − cost (per line) |
| Invoice profit | Sum of line profits − discount impact |
| Received cash | Cash payments + credit settlements only |
| Pending credit | Outstanding customer balances |
| Credit sale | Increases sales/profit on invoice; **not** received cash until paid |

Dashboard and reports expose filters: today, week, month, year, custom range.

---

## Build phases

| Phase | Scope | Status |
|-------|--------|--------|
| **1** | Project setup, Neon, Prisma, auth, RBAC, folders, theme | ✅ Foundation |
| **2** | Company registration, users, dashboard | ✅ Core |
| **3** | Products, approvals, categories, suppliers, CSV | ✅ Core |
| **4** | POS billing, invoices, payments, PDF | 🔄 Ongoing |
| **5** | Inventory, reports, notifications, audit | 🔄 Ongoing |

**First MVP flow:** Register → Admin login → Staff → Product → Approval → POS sale → Invoice → Stock → Dashboard.

---

## Code quality standards

- Production-ready, readable, maintainable TypeScript
- Strong typing end-to-end (DTOs, Prisma types, frontend types)
- Validation on all inputs; consistent HTTP errors
- Thin controllers, fat services, no over-abstraction
- Avoid unnecessary files/folders
- Scalable multi-tenant patterns from day one

---

## Security

- **Never commit** `.env` or `.env.local` (gitignored).
- Use strong, unique `JWT_*_SECRET` in production.
- httpOnly cookies for refresh tokens; `secure` in production.
- CORS locked to `FRONTEND_URL` with `credentials: true`.
- RBAC on admin-only routes (approvals, settings, staff management).
- Tenant isolation enforced in services, not only controllers.

---

## Roadmap & future payments

Planned without breaking current architecture:

- Card / wallet providers (adapter pattern on `Payment`)
- Admin discount override
- Enhanced PDF/receipt templates
- Barcode scanner hardware integration
- Email/SMS notifications

---

## License

Private project — see `backend/package.json` (`UNLICENSED`).

---

## Links

- **Repository:** [github.com/m-asjedh/CountPos](https://github.com/m-asjedh/CountPos)
- **Neon:** [neon.tech](https://neon.tech)
- **NestJS:** [nestjs.com](https://nestjs.com)
- **Next.js:** [nextjs.org](https://nextjs.org)

---

<p align="center"><strong>CountPos</strong> — Multi-tenant cloud POS for modern retail.</p>
