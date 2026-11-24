# PROJECT_CONTEXT.md — `next-MCPIC`

> **Persistent Project Memory** — Read this file before starting any new task and update it after completing every significant milestone.

---

## 1. Project Purpose
`next-MCPIC` is the **Next.js 14 (App Router) + TypeScript + NextAuth + PostgreSQL** rewrite of the **MCPIC** (*Mirpur Cantonment Public Information and Technology Club*) web platform, migrating from the legacy Vite/React + Firebase + Express/MongoDB codebase at `/home/mashrafi47/Mcpic`.

---

## 2. Technology Stack
- **Framework**: Next.js 14 (`^14.2.28`, App Router) + React 18 + TypeScript 5 (`strict: true`) + `next/image` (AVIF/WebP optimization via `sharp`)
- **Auth & MFA**: NextAuth v4 (`^4.24.11`, CredentialsProvider, `httpOnly` JWT sessions, 8h maxAge) + `bcryptjs` (cost 12) + custom RFC 6238 TOTP MFA (`node:crypto` + `qrcode`, AES-256-GCM encrypted secrets at rest, 8 single-use SHA-256 hashed recovery codes)
- **Database**: PostgreSQL 16 via `pg` (`^8.13.1`) with 100% parameterized queries and **forced Row Level Security (RLS)** via least-privilege `mcpic_app` (`NOBYPASSRLS`) role
- **Validation & Security**: Zod (`^3.24.1`), HMAC-signed CSPRNG double-submit CSRF (`SameSite=Strict`, `Secure` in prod, `Path=/`, timing-safe header vs cookie match + `Sec-Fetch-Site` + `Origin`/`Referer`), strict parsed-origin CORS (`ALLOWED_ORIGINS`), SSRF protection (HTTPS + host allowlist + DNS private IP blocking), magic-byte upload verification, sliding-window rate limiting, HMAC-SHA256 webhook verification, redacted JSON logger, disabled source maps
- **UI**: Tailwind CSS 3 + DaisyUI 4 (`dark`/`light`), `next/font/google` (Bebas Neue, Space Grotesk, IBM Plex Mono), TanStack Query v5, React Hook Form, Swiper, Lottie, AOS, native date inputs (removed unmaintained `react-date-range` to resolve npm peer conflicts), `sweetalert2`, `react-hot-toast`
- **Email**: Server-side `nodemailer` SMTP (replaces client-side EmailJS)

---

## 3. Architecture & Important Files
```text
/home/mashrafi47/next-MCPIC/
├── PROJECT_CONTEXT.md, README.md, package.json, next.config.mjs, tsconfig.json,
│   tailwind.config.ts, postcss.config.mjs, .gitignore, .env.example, docker-compose.yml
├── db/schema.sql                  # 9 tables, triggers, FK cascades, and ENABLE/FORCE RLS policies
├── scripts/
│   ├── db-setup.mjs               # Applies schema.sql & configures least-privilege mcpic_app role
│   └── db-seed.mjs                # Seeds initial admin (env or one-time random password) & defaults
├── public/                        # mcpic-logo.png, images/**, animations/** (copied from legacy client)
└── src/
    ├── middleware.ts              # Edge CORS allowlist + session/admin route protection
    ├── types/                     # next-auth.d.ts, models.ts
    ├── data/executives.ts         # Typed 2022–2026 executive panels
    ├── lib/
    │   ├── env.ts, logger.ts, db.ts, auth.ts, mailer.ts, validators.ts, api-client.ts
    │   └── security/              # crypto.ts, totp.ts, rate-limit.ts, csrf.ts, cors.ts, ssrf.ts, sanitize.ts, webhook.ts, guards.ts
    ├── components/                # Providers, PublicShell, Header, Footer, Title, LoadingSpinner, DevelopersSection, Cards/*, HomePage/*
    └── app/
        ├── layout.tsx, globals.css, page.tsx, not-found.tsx
        ├── about/, developers/, events/, events/[slug]/, segments/[id]/, posts/, executives/, contact/
        ├── login/, register/, verify-email/, reset-password/, apply-for-executive/
        ├── dashboard/             # layout, page (Stats), profile (with 2FA), my-forms, manage-users,
        │                          # add-event, all-events, all-event-segments/[eventId], add-event-segment,
        │                          # update-event-segment/[id], add-blog, all-blogs, update-blog/[id], recruit
        └── api/                   # 30 Route Handlers covering auth, csrf, register, verify-email, password-reset,
                                   # profile, mfa, upload/uploads, events, segments, blogs, users,
                                   # executive-forms + recruit, settings/recruitment, admin/stats, contact, webhooks
```

---

## 4. Current Implementation Status

### Completed Tasks
- [x] Audited legacy `/home/mashrafi47/Mcpic` project (bugs, security holes, architecture, tech debt).
- [x] Configured project root, security headers/CSP, `productionBrowserSourceMaps: false`, `next/image` AVIF/WebP optimization (`sharp`), `docker-compose.yml`, `.env.example`, `.gitignore`, and `README.md`.
- [x] Copied all static images, logo, and Lottie animations from legacy `MCPIC-client` into `public/`.
- [x] Created PostgreSQL schema (`db/schema.sql`) with relational FK cascade (`segments.event_id -> events.id`) and forced RLS policies on all 9 tables, plus `scripts/db-setup.mjs` and `scripts/db-seed.mjs`.
- [x] Built hardened security, validation, auth, MFA, and Edge middleware layer (`src/lib/**`, `src/middleware.ts`), including HMAC-signed CSPRNG CSRF tokens (`SameSite=Strict`, `Secure` in prod, `Path=/`) and strict parsed-origin CORS.
- [x] Built all 30 Next.js API route handlers (`src/app/api/**`) with CSRF + CORS + rate limiting + server-side RBAC + RLS.
- [x] Built shared UI shell, homepage sections, all public & auth pages, and all member/admin dashboard pages using Next.js `<Image />` everywhere (`src/components/**`, `src/app/**`).

### Pending Tasks
- [ ] **Host-environment runtime verification** (must be run in host terminal outside snap confinement):
  1. `cp .env.example .env.local` and populate strong random secrets (`openssl rand -hex 32`).
  2. Start PostgreSQL (`POSTGRES_PASSWORD=... docker compose up -d` or local Postgres).
  3. `npm install && npm run db:setup && npm run db:seed`
  4. `npm run typecheck && npm run lint && npm run build && npm audit`
  5. End-to-end smoke test (register, verify email, login, enable 2FA, login with TOTP, admin CRUD, executive application & recruit flow).

---

## 5. Key Technical Decisions
1. **True PostgreSQL RLS**: Every query executes inside `withDbContext()` setting transaction-local `app.user_id` and `app.user_role`, enforced by PostgreSQL on the non-superuser `mcpic_app` (`NOBYPASSRLS`) role.
2. **Event/Segment Foreign Keys & Slugs**: Replaced fragile string `eventName` relations with `segments.event_id UUID REFERENCES events(id) ON DELETE CASCADE` and URL-safe `events.slug`.
3. **HMAC-Signed CSPRNG Double-Submit CSRF**: `crypto.randomBytes(32)` nonce + server HMAC-SHA256 signature stored in `mcpic_csrf_token` (`SameSite=Strict`, `Secure` in prod, `Path=/`) and compared via `crypto.timingSafeEqual` against `X-CSRF-Token` alongside `Sec-Fetch-Site` and `Origin`/`Referer` verification on every mutation.
4. **Next.js `<Image />` Everywhere**: Enabled AVIF/WebP optimization (`sharp`) with strict `remotePatterns` (`i.ibb.co`, `i.ibb.co.com` only) to prevent SSRF; `unoptimized` is applied only to the base64 MFA QR code and `/api/uploads/` local fallback.
5. **Built-in TOTP MFA**: Pure `node:crypto` RFC 6238 TOTP with AES-256-GCM secret encryption at rest and single-use SHA-256 hashed recovery codes.

---

## 6. Known Issues & Environment Constraints
- **Agent shell snap confinement**: `node`, `npm`, `psql`, and `docker` are not mounted inside `/snap/antigravity-cli/25`, so `npm install`, `tsc --noEmit`, `next build`, `npm audit`, and PostgreSQL initialization must be run in the user's host terminal.

---

## 7. Exact Next Step
In your host terminal inside `/home/mashrafi47/next-MCPIC`, configure `.env.local`, start PostgreSQL, and run installation + database setup + build verification:
```bash
cd /home/mashrafi47/next-MCPIC
cp .env.example .env.local   # fill NEXTAUTH_SECRET, MFA_ENCRYPTION_KEY, WEBHOOK_SECRET, DB passwords
POSTGRES_PASSWORD="YOUR_STRONG_PASSWORD" docker compose up -d
npm install
npm run db:setup
npm run db:seed
npm run typecheck && npm run lint && npm run build && npm audit
```
If TypeScript, ESLint, or `next build` reports any issues, share the output so they can be fixed immediately.
