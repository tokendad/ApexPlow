# ApexPlow / PlowDispatch

Snow plow dispatch platform for solo and small operators.

## Prerequisites

- **Node.js v22 LTS** (spec target — see note below)
- **pnpm 9+**
- **Docker + Docker Compose**

> **Note on Node.js version:** The spec requires Node.js 22 LTS. Local development currently runs
> on Node 20. To align with the spec, install nvm and run `nvm install 22 && nvm use 22`.
> The API Docker container always uses `node:20-alpine` matching the local dev environment.
> This will be updated to `node:22-alpine` when Node 22 is adopted locally.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start local services (PostgreSQL + Redis)
docker compose up -d

# Run database migrations
pnpm db:migrate

# Start all apps in development mode
pnpm dev
```

## Project Structure

```
apps/
  api/        — Fastify v5 + TypeScript backend (port 3000)
  admin/      — Admin portal (React 19 + Vite, port 5173)
  customer/   — Customer interface (React 19 + Vite PWA, port 5174)
  driver/     — Driver interface (React 19 + Vite PWA, port 5175)
  worker/     — Background job processor (pg-boss)

packages/
  types/      — Shared TypeScript interfaces
  utils/      — Shared business logic (haversine, cancellation, state machine)
  ui/         — Shared React component library
```

## Development Commands

```bash
pnpm typecheck     # Type-check all workspaces
pnpm build         # Build all workspaces
pnpm test          # Run all tests
pnpm lint          # Lint all workspaces
pnpm db:generate   # Generate Drizzle migration files from schema changes
pnpm db:migrate    # Apply pending migrations
pnpm db:studio     # Open Drizzle Studio (database browser)
```

## Documentation

All planning and design documents are in `docs/`:
- `docs/Design Documents/` — Architecture, Roadmap, UX Design Plan, Q&A
- `docs/Phase Documents/`  — Per-milestone implementation plans
- `docs/Reference Material/` — Pricing research, driveway design reference
