# BuildPro

A full-stack contractor estimation and proposal platform for skilled trades professionals. BuildPro helps contractors create professional estimates, proposals, and invoices with automated calculations, PDF generation, and client tracking.

## Features

- **Dashboard** — Revenue/profit summary, pending estimates, overdue invoices, and trend charts
- **Estimates** — Line-item estimates with labor, materials, subcontractors; markup, tax, and live profit margin calculations
- **Proposals** — Rich-text proposals with 6 PDF template styles and AI-powered text enhancement (OpenAI)
- **Invoices** — Convert estimates to invoices, track payment status
- **Materials Database** — Material catalog with pricing, price history, and supplier linking
- **Clients & Suppliers** — Full CRUD for client and supplier records
- **Settings** — Company info, default tax rate, and markup percentage with database persistence

## Tech Stack

**Backend:** Node.js 24, Express 5, PostgreSQL, Drizzle ORM, Zod, Pino, OpenID Connect (Replit Auth), OpenAI API, Google Cloud Storage

**Frontend:** React 19, Vite 7, Tailwind CSS 4, Wouter, TanStack React Query, shadcn/ui, Recharts, Framer Motion, @react-pdf/renderer

**Monorepo:** pnpm workspaces, TypeScript 5.9

## Project Structure

```
├── artifacts/
│   ├── api-server/          # Express REST API
│   └── contractor-platform/ # React frontend
├── lib/
│   ├── db/                  # Drizzle ORM schema & connection
│   ├── api-spec/            # OpenAPI spec + Orval codegen
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod schemas
│   ├── replit-auth-web/     # Auth context & useAuth() hook
│   └── integrations-openai-ai-server/
└── scripts/
```

## Getting Started

### Prerequisites

- Node.js 24
- pnpm
- PostgreSQL 16

### Installation

```bash
pnpm install
```

### Environment Variables

**API Server:**

| Variable | Description |
|---|---|
| `PORT` | API server port (e.g. `8080`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Secret for session encryption |
| `REPL_ID` | Replit app ID (for OpenID Connect) |
| `ISSUER_URL` | OpenID issuer URL (default: `https://replit.com/oidc`) |
| `OPENAI_API_KEY` | OpenAI API key (for proposal enhancement) |
| `GOOGLE_CLOUD_PROJECT_ID` | Google Cloud Storage project ID |
| `GOOGLE_CLOUD_BUCKET_NAME` | Google Cloud Storage bucket name |

**Frontend:**

| Variable | Description |
|---|---|
| `PORT` | Vite dev server port (e.g. `5173`) |
| `BASE_PATH` | Base path for routing (e.g. `/`) |

### Database Setup

```bash
pnpm --filter @workspace/db run push
```

### Running Locally

```bash
# API server (Terminal 1)
pnpm --filter @workspace/api-server run dev

# Frontend (Terminal 2)
pnpm --filter @workspace/contractor-platform run dev
```

### Build

```bash
pnpm run build
```

### Type Check

```bash
pnpm run typecheck
```

## PDF Templates

Estimates and proposals support 6 template styles: Classic, Modern, Executive, Slate, Minimal, Blueprint.

## Authentication

Authentication is handled via OpenID Connect (PKCE) through Replit Auth. Sessions are stored in PostgreSQL with a 7-day TTL.

## License

Private
