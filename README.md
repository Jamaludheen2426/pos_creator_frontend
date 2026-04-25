# POS Creator Panel (Super Admin)

> SaaS Point-of-Sale Platform — Platform Owner / Super Admin Dashboard

Next.js 15 · React 19 · TypeScript · Tailwind CSS

---

## What This Is

The **Creator Panel** is the internal super-admin dashboard used by the platform owner (the developer / SaaS operator). It is completely separate from the client-facing app and is not accessible to any business customer.

From here, the creator can:
- Onboard and manage all client companies
- Create and configure subscription plans
- Monitor and manage active subscriptions
- Drill into any company's detail page
- Configure global platform settings

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19 + Tailwind CSS |
| State | Zustand |
| Data Fetching | TanStack React Query v5 |
| Forms | React Hook Form + Zod |
| HTTP Client | Axios |
| Icons | Lucide React |
| Toasts | Sonner |
| Date Utilities | date-fns |
| Language | TypeScript |

---

## Project Structure

```
pos_creator_frontend/
├── src/
│   ├── app/
│   │   ├── (dashboard)/        # All creator pages (auth-gated)
│   │   │   ├── layout.tsx          # Sidebar + nav layout
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx        # All companies list
│   │   │   │   └── [id]/page.tsx   # Individual company detail
│   │   │   ├── plans/
│   │   │   │   └── page.tsx        # Plan management (Basic/Pro/Enterprise)
│   │   │   ├── subscriptions/
│   │   │   │   └── page.tsx        # All active subscriptions
│   │   │   └── settings/
│   │   │       └── page.tsx        # Platform-level settings
│   │   ├── login/
│   │   │   └── page.tsx            # Creator login
│   │   ├── layout.tsx
│   │   └── page.tsx                # Root redirect
│   ├── lib/
│   │   ├── api.ts                  # Axios instance with auth headers
│   │   └── utils.ts                # Helper utilities
│   └── store/
│       └── auth.ts                 # Zustand auth store (creator session)
```

---

## Pages

| Route | Description |
|---|---|
| `/login` | Creator-only login (protected by `CREATOR_SECRET` on the backend) |
| `/clients` | Full list of all registered companies with status and plan info |
| `/clients/[id]` | Company detail — users, stores, subscription, module settings |
| `/plans` | Create and edit subscription plans (limits, feature flags) |
| `/subscriptions` | View and manage all company subscriptions across the platform |
| `/settings` | Global platform configuration |

---

## Auth

Authenticates against the backend using the `CREATOR` user role. The backend's `CREATOR_SECRET` environment variable provides an additional layer of protection for creator-only API routes.

The Zustand auth store persists the JWT access token in memory and attaches it to all Axios requests automatically.

---

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Backend Connection

Ensure the backend (`pos_backend`) is running on port 3001. The `src/lib/api.ts` base URL should point to `http://localhost:3001/api/v1`.

### 3. Run

```bash
# Development
npm run dev        # → http://localhost:3003

# Production
npm run build
npm start          # → http://localhost:3000
```

---

## Demo Login (after seeding the backend)

| Email | Password |
|---|---|
| admin@pos.dev | admin123 |

---

## Separation from Client App

This panel is intentionally a **separate Next.js application** from the client web app. This means:
- Different deployment target (internal only — not public-facing)
- Independent auth session with `CREATOR` role check
- No code sharing with client-facing features
- Can be placed behind a VPN or IP allowlist in production
