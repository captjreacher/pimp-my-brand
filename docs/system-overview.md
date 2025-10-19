# Pimp My Brand – System Overview

## Purpose and Product Summary
Pimp My Brand is a React- and Vite-based web application that turns user-submitted materials into polished personal-branding assets. The front end orchestrates content ingestion, AI-assisted style and visual analysis, brand rider creation, CV generation, gallery publishing, and an administrative control plane. Supabase serves as both the authentication/data platform and the host for edge functions that call Lovable's AI gateway and Stripe to enrich the experience.

## Core Technology Stack
- **Runtime & Frameworks:** React 18 with React Router for routing and Suspense-driven code splitting, powered by Vite as the build tool.【F:src/App.tsx†L6-L144】  
- **Language & Tooling:** TypeScript across the client and serverless functions, with SWC-based React compilation and Vite-based development workflows.【F:vite.config.ts†L1-L67】  
- **State & Data:** React Context for cross-cutting state (subscription status, admin session), React Query for request caching, and local storage for lightweight persistence.【F:src/main.tsx†L1-L17】【F:src/contexts/SubscriptionContext.tsx†L16-L82】【F:src/contexts/AdminContext.tsx†L21-L203】【F:src/lib/cache/query-cache.ts†L1-L74】  
- **Styling:** Tailwind CSS with shadcn/ui primitives, custom color tokens, and animation utilities for consistent theming.【F:tailwind.config.ts†L3-L91】  
- **Backend Integrations:** Supabase client SDK, Supabase Edge Functions (Deno) for AI and billing, and Stripe for subscription management.【F:src/integrations/supabase/client.ts†L1-L17】【F:supabase/functions/generate-brand-rider/index.ts†L1-L120】【F:supabase/functions/check-subscription/index.ts†L1-L139】

## Application Architecture
### Entry Point and Routing
`src/main.tsx` mounts the React tree, bootstraps the subscription provider, and conditionally registers the service worker for production caching.【F:src/main.tsx†L1-L17】 `App.tsx` wraps the UI with the React Query client, tooltip/toast providers, and defines all public and admin routes via React Router. Admin routes are nested inside an `AdminProvider` and guarded by permission-aware components.【F:src/App.tsx†L47-L135】

### State Management
- **SubscriptionContext:** Tracks the active plan, trial status, and expiry by invoking a Supabase Edge Function (`check-subscription`) whenever auth state changes or on a five-minute interval.【F:src/contexts/SubscriptionContext.tsx†L16-L82】【F:supabase/functions/check-subscription/index.ts†L15-L139】
- **AdminContext:** Centralizes Supabase-backed admin authentication, permission derivation, session lifecycle, and action logging with support for offline testing. Consumers access helpers such as `useAdminPermissions` and `useAdminActions` for granular checks.【F:src/contexts/AdminContext.tsx†L21-L240】【F:src/lib/admin/auth-service.ts†L1-L200】【F:src/lib/admin/permissions.ts†L1-L128】
- **React Query Cache:** `createOptimizedQueryClient` sets global query policies (stale time, retry, and caching) and exposes cache key helpers and local storage-backed AI result caching for heavy computations.【F:src/lib/cache/query-cache.ts†L1-L74】

### UI Composition
The UI is organized under `src/components` by domain (admin, dashboard, wizard, etc.), while pages in `src/pages` assemble those components into route targets. Tailwind utility classes and shadcn/ui controls (e.g., cards, buttons, tooltips) provide cohesive styling, as showcased on the landing page.【F:src/pages/Landing.tsx†L1-L108】

## Domain Workflows
### Brand Creation Wizard
`src/pages/CreateBrand.tsx` orchestrates a four-step wizard (upload corpus, choose format, configure logo, generate assets) with lazy-loaded steps. State transitions are stored in component state and local storage, and successful completion navigates to the generated brand or accompanying CV.【F:src/pages/CreateBrand.tsx†L7-L200】 The wizard ultimately leverages AI helpers described below.

### AI-Assisted Content Generation
- **Brand Rider:** The front end’s `BrandGenerator` validates analyses, applies format overlays, and produces structured brand riders, while Supabase’s `generate-brand-rider` edge function calls Lovable’s AI API to synthesize Markdown output when supplied with style and visual data.【F:src/lib/generators/brand-generator.ts†L12-L200】【F:supabase/functions/generate-brand-rider/index.ts†L18-L120】
- **Style & Visual Analysis:** Edge functions `generate-style` and `generate-visual` transform uploaded corpus and keywords into tone descriptors, color palettes, font pairings, and logo prompts via AI, returning normalized JSON to the client.【F:supabase/functions/generate-style/index.ts†L8-L95】【F:supabase/functions/generate-visual/index.ts†L8-L98】
- **CV Generation:** `generate-cv` overlays themed voice templates onto extracted text and style analysis to build structured CV JSON, ensuring required fields and format tags are present.【F:supabase/functions/generate-cv/index.ts†L8-L165】

### User Dashboard & Content Search
Hooks such as `useDashboardData` aggregate Supabase tables (brands, CVs, uploads) through React Query, derive counts, and compose recent activity feeds, while `useSearchableContent` merges cross-entity search results.【F:src/hooks/use-dashboard-data.ts†L1-L200】

### Administrative Suite
Admin pages wrap `AdminLayout` with real-time dashboards, health checks, and guardrails. For example, `AdminDashboardPage` uses performance-aware hooks, simulated health checks, and activity feeds, all scoped by admin permissions to surface platform metrics and alerts.【F:src/pages/admin/AdminDashboardPage.tsx†L1-L200】 Supporting services in `src/lib/admin` handle auth, notifications, moderation, and integrations, with offline stubs to facilitate development.【F:src/lib/admin/auth-service.ts†L1-L200】

## Integrations and External Services
- **Supabase Client:** Configured with environment-provided URL and key, persisting sessions in local storage for browser clients.【F:src/integrations/supabase/client.ts†L1-L17】
- **Service Functions:** Supabase Edge Functions encapsulate AI workflows (brand/style/visual/CV generation), asset creation, checkout, and subscription verification; the front end interacts with them through Supabase’s `functions.invoke` API or direct HTTP calls.【F:supabase/functions/generate-brand-rider/index.ts†L18-L120】【F:supabase/functions/generate-style/index.ts†L8-L95】【F:supabase/functions/generate-visual/index.ts†L8-L98】【F:supabase/functions/generate-cv/index.ts†L8-L165】【F:src/contexts/SubscriptionContext.tsx†L23-L51】
- **Stripe Billing:** The `check-subscription` function resolves a user’s Stripe status, maps products to internal tiers, and persists results in Supabase tables, supporting tiered paywalls exposed through the subscription context.【F:supabase/functions/check-subscription/index.ts†L20-L139】【F:src/contexts/SubscriptionContext.tsx†L16-L82】

## Performance, Resilience, and UX Enhancements
- **Service Worker:** `ServiceWorkerManager` registers, updates, and clears caches in production builds, emitting events that can trigger in-app notifications.【F:src/lib/performance/service-worker.ts†L1-L126】
- **Preloading & Web Vitals:** `App.tsx` preloads critical resources and initializes a performance observer, while hooks monitor admin-side metrics and enforce caching strategies.【F:src/App.tsx†L9-L59】【F:src/hooks/use-admin-performance.ts†L1-L163】
- **PDF Export Utilities:** Lazy-loaded PDF tooling caches html2canvas and jsPDF imports and exposes reset helpers to avoid bundling heavy dependencies upfront.【F:src/lib/pdf-export.ts†L1-L65】
- **Build Optimizations:** Vite configuration manual-splits vendor and feature bundles, increases chunk limits, and tunes dependency pre-bundling for expensive libraries.【F:vite.config.ts†L19-L61】

## Styling System
Tailwind’s configuration defines custom color tokens synced with CSS variables, typographic scales for headings/body, and bespoke shadows/animations that surface throughout the UI (e.g., gradient cards, hero sections). This allows designers to adjust themes centrally without rewriting components.【F:tailwind.config.ts†L7-L91】

## Testing and Quality Assurance
The project uses Vitest with a jsdom environment. `src/test/setup.ts` seeds mock environment variables, polyfills browser APIs (MatchMedia, IntersectionObserver, ResizeObserver), and stubs File APIs to stabilize component tests.【F:vite.config.ts†L62-L66】【F:src/test/setup.ts†L1-L91】 Component, hook, and page tests live under `src/test/` alongside reusable fixtures.

## Build & Operational Tooling
`package.json` exposes scripts for development, linting, testing, preview, and a deployment validation chain (`npm run deploy:check`) that combines tests, lint, deployment validation, and build. Vite’s dev server defaults to port 8080, and production publishing is typically handled through Lovable’s deployment pipeline.【F:package.json†L1-L49】【F:vite.config.ts†L8-L13】

## Directory Highlights
- `src/pages/` – Route-level views for user flows (landing, dashboard, brand editor, admin suite).【F:src/App.tsx†L15-L138】
- `src/components/` – Shared UI, wizard steps, admin layout, and export/share tooling.
- `src/hooks/` – Custom hooks for admin analytics, dashboard data, accessibility, and state helpers.【F:src/hooks/use-dashboard-data.ts†L1-L200】【F:src/hooks/use-admin-performance.ts†L1-L163】
- `src/lib/` – Domain logic (AI generators, export utilities, caching, admin services, validation).【F:src/lib/generators/brand-generator.ts†L12-L200】【F:src/lib/pdf-export.ts†L1-L65】
- `supabase/` – Edge function source, database migrations, and config powering AI generation, billing, and content pipelines.【F:supabase/functions/generate-brand-rider/index.ts†L1-L120】【F:supabase/functions/generate-cv/index.ts†L1-L165】

## Operational Considerations
- Environment variables must include Supabase credentials, Stripe keys, and Lovable AI keys for the edge functions and client configuration.【F:src/integrations/supabase/client.ts†L5-L17】【F:supabase/functions/generate-brand-rider/index.ts†L26-L37】【F:supabase/functions/check-subscription/index.ts†L20-L139】
- PDF/export-heavy modules (`jspdf`, `html2canvas`, OCR tooling) are purposely excluded from dependency pre-bundling and lazy-loaded to keep the main bundle lean.【F:vite.config.ts†L19-L60】【F:src/lib/pdf-export.ts†L1-L65】
- Admin offline stubs and guard components allow secure testing without fully provisioning backend services.【F:src/lib/admin/auth-service.ts†L1-L125】【F:src/App.tsx†L89-L135】

This document should provide new contributors and stakeholders with a clear map of the system’s moving parts, the technologies involved, and how major features hang together across the client and Supabase infrastructure.
