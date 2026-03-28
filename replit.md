# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, Tailwind CSS, React Query, shadcn/ui, Recharts

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server (port 8080)
│   └── contractor-platform/ # React Vite frontend (preview path /)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Application: Contractor Estimate Platform

A full-stack contractor estimation platform called "ProBuilder".

### Features
- **Dashboard**: Revenue, profit, pending estimates, overdue invoices, Revenue & Profit Trend chart
- **Estimates**: Create/edit estimates with line items (labor/material/subcontractor/other), markup %, tax %, live profit calculation, status workflow (draft → sent → approved → invoiced), PDF generation
- **Invoices**: Convert estimates to invoices, track payments (mark paid/partial), status workflow (draft → sent → paid → overdue)
- **Materials Database**: Track material prices with price history, filter by supplier/category, link to Home Depot, Lowe's, etc.
- **Clients**: CRUD for client records (name, email, phone, address)
- **Suppliers**: Manage suppliers (pre-seeded: Home Depot, Lowe's, 84 Lumber, Ferguson, Grainger, ABC Supply)

### Database Schema
- `clients` - Client records
- `suppliers` - Supplier records (pre-seeded)
- `materials` - Material catalog with pricing
- `material_price_history` - Price history per material
- `estimates` - Estimate header (status, totals, markup, tax, profit margin)
- `line_items` - Estimate line items (labor/material/subcontractor/other)
- `invoices` - Invoice records linked to estimates

### API Routes (all under /api)
- `GET/POST /clients`, `GET/PUT/DELETE /clients/:id`
- `GET/POST /suppliers`, `PUT/DELETE /suppliers/:id`
- `GET/POST /materials`, `PUT/DELETE /materials/:id`, `GET /materials/:id/price-history`
- `GET/POST /estimates`, `GET/PUT/DELETE /estimates/:id`, `POST /estimates/:id/convert-to-invoice`, `POST/PUT/DELETE /estimates/:id/line-items/:lineItemId`
- `GET/POST /invoices`, `GET/PUT /invoices/:id`
- `GET /dashboard/stats`

### Running
- API Server: `pnpm --filter @workspace/api-server run dev`
- Frontend: `pnpm --filter @workspace/contractor-platform run dev`
- DB schema push: `pnpm --filter @workspace/db run push`
- Codegen: `pnpm --filter @workspace/api-spec run codegen`
