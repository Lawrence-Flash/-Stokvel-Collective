# 🛒 Stokvel Collective Bulk-Buying Platform

> Empowering South African township communities (stokvels) to pool purchasing power to buy fast-moving consumer goods (FMCG) directly from wholesale distributors at scale.

[![CI Pipeline](https://github.com/Lawrence-Flash/-Stokvel-Collective/actions/workflows/ci.yml/badge.svg)](https://github.com/Lawrence-Flash/-Stokvel-Collective/actions/workflows/ci.yml)
[![CodeQL](https://github.com/Lawrence-Flash/-Stokvel-Collective/actions/workflows/codeql.yml/badge.svg)](https://github.com/Lawrence-Flash/-Stokvel-Collective/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7+-DC382D.svg)](https://redis.io/)

---

## 📖 Overview

The **Stokvel Collective Bulk-Buying Platform** bridges community purchasing groups in South African townships (such as Soweto, Alexandra, and Tembisa) directly with FMCG wholesale suppliers. By aggregating household demand for essentials like maize meal, cooking oil, rice, and sugar, members save up to **25%–35%** compared to traditional retail pricing.

The platform is designed with key requirements for township commerce:
- **Low-Bandwidth Mobile Optimization**: Ultra-lightweight UI components engineered to load fast on 2G/3G cellular connections.
- **Passwordless Phone OTP Auth**: Low-friction authentication using mobile phone numbers and 6-digit SMS verification.
- **Smart Escrow Protection**: Payments are held safely in escrow. If a bulk pool does not reach its minimum order volume before expiry, payments are automatically refunded.
- **Township Hub Pickup & Dispatch**: Verified pickup stations (e.g. Soweto Central Hub) manage order collection using 6-digit passcodes.

---

## 🏛️ System Architecture

```text
+-----------------------------------------------------------------------------------+
|                                Client Layer (Web)                                 |
|         Next.js 14+ (App Router) • Tailwind CSS • Lucide React • TanStack         |
+-----------------------------------------+-----------------------------------------+
                                          | HTTP / REST / JSON
                                          v
+-----------------------------------------------------------------------------------+
|                               Node.js API Service                                 |
|            Express • TypeScript • Prisma ORM • Zod • express-rate-limit           |
+-----------------------------------------+-----------------------------------------+
                    |                                          |
                    v                                          v
+---------------------------------------+  +----------------------------------------+
|         PostgreSQL 16 (Primary)       |  |       Redis 7 Cache & Message Bus      |
|  Relational Data • Row-Level Locks    |  |   Session Cache • Rate Limit Counters  |
|  ACID Transactions for Buying Pools   |  |        BullMQ Processing Queues        |
+---------------------------------------+  +----------------------------------------+
                                                               |
                                                               v
                                           +----------------------------------------+
                                           |        BullMQ Background Workers       |
                                           | Pool Lifecycle Monitor • Auto Refunds  |
                                           | Escrow Reconciliations • SMS Dispatch  |
                                           +----------------------------------------+
```

---

## 📦 Monorepo Structure

```text
-Stokvel-Collective/
├── apps/
│   ├── api/                   # Express + TypeScript backend API service
│   │   ├── src/
│   │   │   ├── jobs/          # BullMQ queue & workers (poolMonitor.ts)
│   │   │   ├── middleware/    # Auth (JWT), rate limiting, Zod validation
│   │   │   ├── modules/       # Domain modules (auth, pool, fulfillment)
│   │   │   └── routes/        # Express route definitions
│   │   ├── Dockerfile         # Multi-stage production container build
│   │   └── vitest.config.ts   # Vitest unit test configuration
│   └── web/                   # Next.js 14+ frontend application
│       ├── app/
│       │   ├── checkout/      # Group order checkout & Instant EFT simulation
│       │   ├── manager/       # Hub Manager stock redemption portal
│       │   ├── portal/        # Member collection voucher view
│       │   ├── page.tsx       # Live marketplace & active pools
│       │   └── layout.tsx     # Responsive layout & township branding
│       └── components/        # Low-bandwidth UI components (PoolProgress.tsx)
├── packages/
│   ├── config/                # Shared ESLint, Prettier, and TypeScript configurations
│   ├── database/              # Prisma schema, migrations, seed script, client singleton
│   └── types/                 # Shared TypeScript domain contracts & API DTOs
├── docker-compose.yml         # Containerized PostgreSQL 16, Redis 7, and Adminer
├── pnpm-workspace.yaml        # PNPM monorepo workspace definition
└── tsconfig.base.json         # Strict TypeScript compiler baseline
```

---

## 🚀 Key Features

### 1. Passwordless Phone OTP Authentication
- Generates secure 6-digit one-time passcodes stored in Redis with 5-minute expiration.
- Exchanges verified codes for signed JWT access tokens with 7-day lifespans.
- Rate-limited to 5 requests per 15 minutes to prevent brute-forcing.

### 2. Buying Pool Engine & Atomic Transactions
- Interactive progress visualization showing ordered units, target threshold, and savings percentage against retail.
- ACID transaction execution ensuring orders and pool capacity counters update concurrently without oversubscription.
- Automatically locks the buying pool when the wholesale minimum volume target is reached.

### 3. Escrow Ledger & Automated Lifecycle Worker
- Financial records track payments from `HELD_IN_ESCROW` through to wholesale disbursement.
- BullMQ background worker monitors active pools every 60 seconds.
- If a pool expires without reaching its target threshold, status shifts to `CANCELLED` and automated refunds trigger for all pool participants.

### 4. Collection Voucher & Hub Manager Scanner
- Generates unique 6-digit collection passcodes (e.g. `849 204`) per paid order.
- Hub Managers at local collection depots verify codes via the manager portal.
- On verification, stock is released, order status transitions to `COLLECTED`, and escrow funds are disbursed to suppliers.

---

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ LTS or v24)
- [pnpm](https://pnpm.io/) (v9+ or v12+)
- [Docker & Docker Compose](https://www.docker.com/)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Lawrence-Flash/-Stokvel-Collective.git
cd -Stokvel-Collective
pnpm install
```

### 2. Environment Setup
Copy the environment variables template:
```bash
cp .env.example .env
```

Default configuration:
```ini
DATABASE_URL="postgresql://stokvel_user:stokvel_secure_password@localhost:5432/stokvel_db?schema=public"
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT=6379
JWT_SECRET="stokvel_jwt_secret_key_2026_super_safe"
PORT=4000
NODE_ENV="development"
```

### 3. Start Database & Redis Services
```bash
docker compose up -d
```
- **PostgreSQL 16**: `localhost:5432`
- **Redis 7**: `localhost:6379`
- **Adminer DB UI**: `http://localhost:8085`

### 4. Apply Schema & Seed Initial Data
```bash
# Push schema to database
pnpm db:push

# Seed demo users, pickup hubs, products, and open buying pools
pnpm db:seed
```

### 5. Launch Development Services
Run the backend API and frontend web application:
```bash
# Start backend API (Port 4000)
pnpm dev:api

# In another terminal, start frontend web app (Port 3005)
pnpm dev:web
```

Access the web interface at: **[http://localhost:3005](http://localhost:3005)**.

---

## 🧪 Testing & Validation

### Run Unit & Integration Tests
```bash
pnpm test
```
Vitest covers pool contributions and running balances, escrow holds, supplier disbursements, unmet-pool refunds, request validation, and phone-OTP / JWT helpers.

### Type Check & Build
```bash
# Run strict type checking across all workspace packages
pnpm typecheck

# Build all packages and applications for production
pnpm build
```

---

## 🔐 Security & CI

Pushes and pull requests to `main` run a free pipeline. Nothing here needs GitHub Advanced Security or a paid scanner license.

| Check | What runs |
| --- | --- |
| CI Pipeline | Frozen pnpm install, ESLint, TypeScript, Vitest, production build, and `pnpm audit` |
| CodeQL | Static analysis for JavaScript/TypeScript and GitHub Actions workflows |
| Dependency Review | Fails a pull request that introduces a known-vulnerable dependency |
| Gitleaks | Secret scan of the full git history on a personal public repository (no license key) |
| Dependabot | Weekly update PRs for npm, GitHub Actions, and Docker |

`pnpm audit` currently reports existing high and critical advisories, mostly in Next.js 14 and Vitest 1. Those fixes are major upgrades, so the audit step prints the report and does not fail the job. Dependency Review still blocks new vulnerable dependencies. Local demo credentials in `.env.example` and the API's development JWT fallback are placeholders and should be replaced before any real deployment.

---

## 🔌 API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/health` | Service health status | No |
| `POST` | `/auth/request-otp` | Request 6-digit phone OTP (Rate-limited) | No |
| `POST` | `/auth/verify-otp` | Verify OTP code & obtain JWT | No |
| `GET` | `/auth/me` | Fetch authenticated user profile | Yes (JWT) |
| `GET` | `/api/pools` | List active collective buying pools | No |
| `GET` | `/api/pools/:id` | Get details for specific buying pool | No |
| `POST` | `/api/orders` | Place atomic order with escrow creation | No / Yes |
| `GET` | `/api/orders/:id` | Get collection voucher details | No |
| `POST` | `/api/fulfillment/redeem` | Hub manager redemption of OTP passcode | No / Manager |

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
