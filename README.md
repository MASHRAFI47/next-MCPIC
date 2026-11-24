# next-MCPIC

Hardened **Next.js 14 (App Router) + TypeScript + NextAuth + PostgreSQL (with Row Level Security)** rewrite of the **MCPIC** (*Mirpur Cantonment Public Information and Technology Club*) web platform.

## Security Architecture Highlights

- **Injection & Input**
  - **SQL Injection**: 100% parameterized queries (`$1, $2, ...`) via `pg` + strict Zod UUID/schema validation.
  - **XSS**: Strict `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, input sanitization (`src/lib/security/sanitize.ts`), zero `dangerouslySetInnerHTML`, and safe image URL validation.
  - **CSRF**: NextAuth built-in CSRF + custom **HMAC-signed CSPRNG double-submit cookie** (`SameSite=Strict`, `Secure` in prod, `Path=/`) validated via `crypto.timingSafeEqual` against the `X-CSRF-Token` header, plus `Sec-Fetch-Site` and `Origin`/`Referer` allowlist checks on every `POST`, `PUT`, `PATCH`, and `DELETE` route.
  - **File Upload Validation**: Server-side `/api/upload` checks file size, MIME allowlist, and binary **magic bytes** (JPEG/PNG/WebP), assigns UUID filenames, and keeps `IMGBB_API_KEY` strictly server-side (with safe local storage fallback served via `/api/uploads/[filename]`).
  - **SSRF Protection**: `src/lib/security/ssrf.ts` enforces HTTPS-only outbound calls, hostname allowlists, and DNS lookup checks blocking private, loopback, link-local, and cloud metadata IPs. Next.js `<Image />` `remotePatterns` is tightly restricted to `i.ibb.co` and `i.ibb.co.com`.
- **Authentication & Access**
  - **BOLA Fixed**: User-scoped endpoints (`/api/executive-forms/me`, `/api/executive-forms/[id]`, `/api/profile`) derive identity solely from the verified server session and verify ownership.
  - **Rate Limiting**: Sliding-window per-IP and per-account rate limiting (`src/lib/security/rate-limit.ts`) across auth, registration, MFA, password reset, uploads, contact, and writes.
  - **Password Hashing**: `bcryptjs` (cost factor 12) + strong password policy + SHA-256 hashed verification/reset tokens & recovery codes.
  - **Multi-Factor Authentication (MFA)**: Built-in RFC 6238 TOTP authenticator app enrollment (QR code + manual key), AES-256-GCM encrypted secrets at rest, 8 single-use hashed recovery codes, and MFA login challenge.
  - **Server-Side RBAC**: `guardRequest` (`src/lib/security/guards.ts`) + Edge `src/middleware.ts` enforce authentication and `admin` permissions server-side with live DB `token_version` revalidation.
  - **PostgreSQL Row Level Security (RLS)**: `ENABLE` and `FORCE ROW LEVEL SECURITY` on all 9 tables in `db/schema.sql`, enforced via least-privilege `mcpic_app` (`NOBYPASSRLS`) role and transaction-local `app.user_id` / `app.user_role` settings.
- **Secrets, Config & Hygiene**
  - No `localStorage` or `sessionStorage` tokens anywhere (`httpOnly`, `SameSite=Lax` cookies only).
  - No hardcoded default passwords; `scripts/db-seed.mjs` uses env credentials or prints a random one-time password.
  - Strict CORS allowlist (`ALLOWED_ORIGINS`, exact parsed origin matching, never `*`), HMAC-SHA256 webhook verification with 5-minute replay window (`/api/webhooks`), disabled production source maps (`productionBrowserSourceMaps: false`), and automatic sensitive-field redaction in `src/lib/logger.ts`.

---

## Quick Start

### 1. Configure Environment Variables
```bash
cp .env.example .env.local
```
Generate strong secrets and fill `.env.local`:
```bash
openssl rand -hex 32   # NEXTAUTH_SECRET
openssl rand -hex 32   # MFA_ENCRYPTION_KEY
openssl rand -hex 32   # WEBHOOK_SECRET
```
Also set strong passwords for `DATABASE_ADMIN_URL`, `DATABASE_URL` (`mcpic_app`), and `DB_APP_PASSWORD`.

### 2. Start PostgreSQL
Using Docker Compose:
```bash
POSTGRES_PASSWORD="YOUR_STRONG_PG_ADMIN_PASSWORD" docker compose up -d
```
*(Or point `DATABASE_ADMIN_URL` / `DATABASE_URL` to an existing PostgreSQL 15/16 instance with database `mcpic` created.)*

### 3. Install Dependencies, Apply Schema + RLS, and Seed Admin
```bash
npm install
npm run db:setup
npm run db:seed
```

### 4. Verify & Run
```bash
npm run typecheck
npm run lint
npm run build
npm audit
npm run dev
```
Open `http://localhost:3000`. Sign in with the seeded admin account and enable 2FA under **Dashboard → Profile & MFA**.
