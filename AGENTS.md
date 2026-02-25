# Repository Guidelines

## Project Structure & Module Organization

- `apps/` contains the product surfaces and services.
- `apps/api/` is the Fastify v5 + TypeScript backend (port `3000`).
- `apps/admin/`, `apps/customer/`, `apps/driver/` are React 19 + Vite apps (ports `5173`, `5174`, `5175`).
- `apps/worker/` runs background jobs with `pg-boss`.
- `packages/` holds shared code: `types/` (interfaces), `utils/` (business logic), `ui/` (component library).
- `docs/` contains architecture, roadmap, and phase plans.

## Build, Test, and Development Commands

- `pnpm install` installs workspace dependencies.
- `docker compose up -d` starts PostgreSQL + Redis.
- `pnpm db:migrate` applies Drizzle migrations for the API.
- `pnpm dev` runs all apps via Turbo.
- `pnpm build` builds all workspaces.
- `pnpm typecheck` runs `tsc --noEmit` across workspaces.
- `pnpm lint` runs ESLint across workspaces.
- `pnpm test` runs workspace tests (currently in `packages/utils`).

## Coding Style & Naming Conventions

- Formatting: Prettier with 2-space indentation, semicolons, single quotes, 100-char line width.
- Linting: ESLint with `@typescript-eslint` rules; unused args must be prefixed with `_`.
- TypeScript: prefer type imports and avoid `any` (warned by ESLint).
- Tests: name files `*.test.ts` (examples in `packages/utils/src/`).

## Testing Guidelines

- Framework: `vitest` for `packages/utils`.
- Place tests next to the source file or in the same folder (current pattern is co-located).
- Run all tests with `pnpm test`, or `pnpm --filter @plowdispatch/utils test` for utils only.

## Commit & Pull Request Guidelines

- Commit history is minimal and does not define a strict convention. Use concise, imperative messages (e.g., `Add cancellation fee rules`).
- PRs should include a short summary, testing notes (commands + results), and screenshots for UI changes.
- Link relevant issues or docs in `docs/` when applicable.

## Security & Configuration Tips

- Copy `.env.example` to `.env` and fill secrets locally. Do not commit real credentials.
- Generate JWT secrets with `openssl rand -hex 32` as documented in `.env.example`.
- CORS origins are configured via `CORS_ORIGINS`.
