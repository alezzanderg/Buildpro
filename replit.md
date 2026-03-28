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
- **Proposals**: Create rich-text proposals (PROP-XXXX) with editable sections: Introduction, Scope of Work, Deliverables, Timeline, Payment Terms, Terms & Conditions. Status workflow (draft → sent → accepted → rejected). PDF generation with 6 templates. Auto-save with 1.5s debounce.
- **Estimates**: Create/edit estimates with line items (labor/material/subcontractor/other), markup %, tax %, live profit calculation, status workflow (draft → sent → approved → invoiced), PDF generation
- **Invoices**: Convert estimates to invoices, track payments (mark paid/partial), status workflow (draft → sent → paid → overdue)
- **Materials Database**: Track material prices with price history, filter by supplier/category, link to Home Depot, Lowe's, etc.
- **Clients**: CRUD for client records (name, email, phone, address)
- **Suppliers**: Manage suppliers (pre-seeded: Home Depot, Lowe's, 84 Lumber, Ferguson, Grainger, ABC Supply)
- **Settings**: Company info (name, address, phone, email, license), Default Tax Rate & Markup with preset quick-select buttons

### Authentication
- **Replit Auth** (OpenID Connect + PKCE) via `openid-client` v6
- Server: auth routes at `/api/login`, `/api/callback`, `/api/logout`, `/api/auth/user`
- `authMiddleware` loads user from session on every request (`req.user`, `req.isAuthenticated()`)
- Sessions stored in DB (`sessions` table) — `SESSION_SECRET` env var required
- Client: `@workspace/replit-auth-web` (lib) — `useAuth()` hook for auth state, login, logout
- Landing page shown to unauthenticated users; app protected by auth gate in `App.tsx`
- User profile shown in AppLayout header with dropdown logout

### Database Schema
- `users` - Auth users (id, email, first_name, last_name, profile_image_url)
- `sessions` - Auth sessions (sid, sess JSON, expire)
- `settings` - Company settings singleton (id=1, persists company info + defaults)
- `clients` - Client records
- `suppliers` - Supplier records (pre-seeded)
- `materials` - Material catalog with pricing
- `material_price_history` - Price history per material
- `estimates` - Estimate header (status, totals, markup, tax, profit margin)
- `line_items` - Estimate line items (labor/material/subcontractor/other)
- `invoices` - Invoice records linked to estimates
- `proposals` - Proposal documents (PROP-XXXX) with rich text sections

### PDF Templates (shared across Proposals and Estimates)
- File: `src/lib/estimatePdf.tsx` — 6 templates (Classic, Modern, Executive, Slate, Minimal, Blueprint)
- File: `src/lib/proposalPdf.tsx` — proposal-specific layout reusing same 6 template color schemes
- Fonts: Helvetica (R), Helvetica-Bold (B), Courier (M) — no Font.register needed
- Markup % is never shown to client; only line items → Tax → Project Total

### API Routes (all under /api)
- `GET /auth/user`, `GET /login`, `GET /callback`, `GET /logout`
- `GET/POST /clients`, `GET/PUT/DELETE /clients/:id`
- `GET/POST /suppliers`, `PUT/DELETE /suppliers/:id`
- `GET/POST /materials`, `PUT/DELETE /materials/:id`, `GET /materials/:id/price-history`
- `GET/POST /estimates`, `GET/PUT/DELETE /estimates/:id`, `POST /estimates/:id/convert-to-invoice`
- `GET/POST /invoices`, `GET/PUT /invoices/:id`
- `GET/POST /proposals`, `GET/PUT/DELETE /proposals/:id`
- `GET /dashboard/stats`
- `GET/PUT /settings` — singleton company settings (id=1)
- `POST /proposals/enhance-text` — SSE streaming AI text enhancement

### Key Frontend Patterns
- Proposals use custom React Query hooks (`useProposals.ts`) with direct fetch — no codegen overhead
- Company settings stored in DB (`settings` table, id=1) via `/api/settings` — migrates old localStorage data on first load
- Default tax/markup applied when creating new estimates via `loadCompanySettings()`
- Auth gate in `App.tsx`: unauthenticated → `<Landing />`, authenticated → full app routes
- `lib/replit-auth-web` defines `AuthUser` type locally (no api-zod dependency)
- Auth routes in api-server use inline types (no api-zod imports needed)

### Running
- API Server: `pnpm --filter @workspace/api-server run dev`
- Frontend: `pnpm --filter @workspace/contractor-platform run dev`
- DB schema push: `pnpm --filter @workspace/db run push`
- Codegen: `pnpm --filter @workspace/api-spec run codegen`
