# Agent Onboarding: Dispatch Monorepo

This guide provides a high-signal overview for AI agents working on the Dispatch ecosystem.

## 1. Project Architecture

The codebase is a Bun-powered monorepo managing an emergency dispatch system.

- **`packages/dispatch-lib`**: The Core Shared Library.
  - **Logic**: Contains all API methods (`DispatchClient`), custom hooks, and Zod schemas.
  - **Types**: Home of the "Source of Truth" TypeScript definitions for the database.
  - **Platform**: Used by both the mobile application (React Native) and the Admin Dashboard.
  
- **`packages/dashboard-frontend`**: The Admin Interface.
  - **Tech**: Next.js (App Router), TailwindCSS, Shadcn UI.
  - **Function**: High-level management of users, incidents, officers, and system-wide configurations.

- **`packages/dispatch-push`**: Push Notification Service.
  - **Function**: Handles real-time FCM delivery for incident alerts.

---

## 2. Mandatory Protocol: Type Synchronization

**NEVER** manually edit `database.types.ts` in any package. To ensure 100% type safety and synchronization with the Supabase schema, you must always auto-generate types after any database change (migrations, functions, or RLS updates).

### Command to Run
Navigate to the library directory and run the sync command. This fetches the schema from the live Supabase instance and updates the local type definitions.

```bash
cd packages/dispatch-lib && bun run sync-types
```

*Note: This command requires the `SUPABASE_PROJECT_ID` and `SUPABASE_ACCESS_TOKEN` to be present in the environment or `.env` file.*

---

## 3. Engineering Standards

- **Never Break React Native Compatibility**: The `packages/dispatch-lib` package is consumed by the React Native mobile app. Never introduce changes that break mobile functionality, such as using browser-only APIs, Node.js-specific modules, or platform-dependent code. Always verify changes work in both environments.
- **Surgical Updates**: When modifying the library, ensure changes are compatible with both the Dashboard and the Mobile App.
- **Zod for Runtime**: Always update the corresponding Zod schema in `packages/dispatch-lib/types.ts` when the database schema changes.
- **Testing**: Integration tests for core logic (like Trust Scoring) are located in `packages/dispatch-lib/tests/`. Always run these after core changes.

## 4. Key Symbols
- `DispatchClient`: Singleton class for all database interactions.
- `useTrustScores()`: Primary hook for admin-level user reputation management.
- `recalculate_user_trust_score`: Postgres trigger function (The scoring engine).

---
**Goal**: Maintain a type-safe, backend-driven architecture where the database is the source of truth.
