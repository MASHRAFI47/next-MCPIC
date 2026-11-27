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
- **UI**: Tailwind CSS 3 + DaisyUI 4 (`dark`/`light`), `next/font/google` (Bebas Neue, Space Grotesk, IBM Plex Mono), TanStack Query v5, React Hook Form, Lottie, zero-dependency `IntersectionObserver` `<Reveal>` scroll animations (replaced `aos`), native date inputs (removed unmaintained `react-date-range` to resolve npm peer conflicts), `sweetalert2`, `react-hot-toast`
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
- [x] Fixed SSR Login spinner flash (hydrated `getServerSession` in `src/app/layout.tsx` -> `<SessionProvider session={session}>`) and navigation latency (moved public routes into shared `src/app/(public)/layout.tsx` + `loading.tsx`, enabled `experimental.optimizePackageImports` + `next dev --turbo`, dynamic-imported `lottie-react` and `Achievements`, throttled JWT DB revalidation to 30s, refreshed AOS on route changes).
- [x] Redesigned landing page `Achievements` section (replaced dated Swiper coverflow with a 7-item Bento Gallery + keyboard-accessible Lightbox Modal + adjacent preloading & skeleton loader), redesigned `Posts` page (search bar, featured latest post card, 2-column editorial grid, Full Post Reader Modal, modern community sidebar), and polished UI across `Header`, `Footer` (v2.0 badge), `RecentEventCard`, and `globals.css`.
- [x] Fixed slow `/dashboard` navigation (5–10s -> instant): replaced 8 heavy `react-icons/*` packs (including 15MB `react-icons/gi`) in `dashboard/layout.tsx` and `dashboard/page.tsx` with tiny zero-dep inline SVGs (`src/components/Icons.tsx`), converted `dashboard/page.tsx` to a Server Component with a single combined SQL query, added `src/app/dashboard/loading.tsx` skeleton, and added eager `router.prefetch` for `/dashboard` & `/dashboard/profile` on the profile avatar menu.
- [x] Removed all loading spinners across the app and replaced them with tailored dark-teal skeleton loaders (`src/components/Skeletons.tsx`: `CardsGridSkeleton`, `PostsPageSkeleton`, `SegmentDetailsSkeleton`, `TablePageSkeleton`, `FormCardSkeleton`, `ProfilePageSkeleton`, `PageSkeleton`).
- [x] Implemented all 5 **Tier 1** features:
  1. **Event & Segment Online Registration + Sanitized CSV Export**: `segment_registrations` table + RLS, `segments` registration fields, `/api/segments/[id]/registrations` (+ `/export` with CSV formula-injection neutralization), `/api/registrations/me`, `/api/registrations/[id]`, live registration & ticket UI on `/segments/[id]`, admin `/dashboard/segment-registrations/[segmentId]`, and member `/dashboard/my-registrations`.
  2. **Admin Contact Inbox**: `contact_messages.status` (`unread|read|resolved`) + RLS, `/api/admin/messages` + `/[id]`, `/dashboard/messages`.
  3. **Security & Activity Audit Log Viewer**: `/api/admin/audit-logs`, `/dashboard/audit-logs`.
  4. **Database-Driven Executive Panels & Achievements Manager**: `executive_members` & `achievements` tables + RLS + auto-seeding in `scripts/db-seed.mjs`, CRUD APIs (`/api/executives`, `/api/achievements`), public `/executives` & `Achievements` wired to PostgreSQL, admin `/dashboard/manage-executives` & `/dashboard/manage-achievements`.
  5. **Shareable Post Permalinks (`/posts/[slug]`) + Dynamic Open Graph Metadata**: `blogs.slug` + unique index, `/api/blogs/slug/[slug]`, Server Component `/posts/[slug]` with `generateMetadata()`, and `SharePostButton`.
- [x] Fixed dev-port `CORS origin forbidden` (e.g., running `next dev` on port `3001`) by permitting **dev-only same-origin** `http://localhost:<port>` / `http://127.0.0.1:<port>` matching the request `Host` header across `middleware.ts`, `cors.ts`, `csrf.ts`, and `guards.ts` (strictly disabled in production, still blocking all cross-origin requests), switched dev reset/verify links to relative paths, and fixed silent `/login` errors by adding `catch` handling + inline error banner alongside `toast.error`.
- [x] Fixed sidebar & header active navigation state bugs: removed DaisyUI `.menu` `:focus` specificity overrides in `src/app/dashboard/layout.tsx` and `src/components/Header.tsx` (so active nav items keep their exact teal styling immediately on click and never change color on blur), and fixed segment-boundary route matching so `/dashboard/add-event-segment` no longer activates `/dashboard/add-event`.
- [x] Removed `aos` and `@types/aos` from `package.json`, `layout.tsx`, and `Providers.tsx`; built zero-dependency `src/components/Reveal.tsx` (`IntersectionObserver` + GPU CSS transforms + `prefers-reduced-motion` support) and applied smooth staggered reveals, ambient floating hero card, marquee hover pause/edge fades, modal entrance animations, and card hover lifts across all public pages.
- [x] Added full **White / Dark Mode** toggle across public pages, auth pages, and the dashboard: server-rendered cookie persistence (`mcpic_theme` read in `src/app/layout.tsx`, zero flash), `ThemeContext` + dynamic `<Toaster>` in `src/components/Providers.tsx`, `<ThemeToggle />` placed left of Login/Profile in `src/components/Header.tsx` and in both desktop sidebar & mobile bar of `src/app/dashboard/layout.tsx`, plus a crisp white + deep-teal light theme design system in `src/app/globals.css` with `.keep-dark` safeguards for code terminal, photo overlays, and stat badges.
- [x] Fixed `SectorCard` 3D tilt smoothness (`requestAnimationFrame` lerp + static outer measurement wrapper + cursor spotlight glow) and uniform equal card heights across `WhoWeAre` ("Our Sectors").
- [x] Generated 6 bespoke tech cover images and expanded `scripts/db-seed.mjs` to idempotently seed 4 flagship demo events, 9 event segments (solo & team online registration enabled), and 6 inspiring tech blog posts (AI coding agents, Zero-Trust cybersecurity, Next.js & web performance, Hackathon playbook, UI/UX micro-interactions, Robotics/ESP32/TinyML).
- [x] Implemented **Role-Aware Notification Center** (`notifications` + `notification_reads` with forced PostgreSQL RLS, `src/lib/notifications.ts`, `/api/notifications`, `/api/notifications/read`, `<NotificationBell />` in Header & Dashboard with unread badges, optimistic read-all, and Admin Quick Announcement broadcast; auto-triggered on new events, blogs, recruitment opening, contact messages, executive applications/recruitment, segment registrations, and new member signups).
- [x] Full-stack performance & DB round-trip optimization: added 1-round-trip `queryPublic()` helper in `src/lib/db.ts` (cutting public reads from 4 DB round-trips to 1 + warm `min: 2` pool), combined `/api/notifications` and `/api/events/slug/[slug]` into single SQL queries, added `Cache-Control: public, max-age=15..30, stale-while-revalidate` on public GET APIs, converted `/`, `/events`, `/posts`, and `/executives` to parallel Server Components hydrating client `initialData` (eliminating client fetch waterfalls & skeleton flashes), tuned JWT revalidation (`120s`) & TanStack Query caching/polling, and eliminated GPU scroll jank in `Reveal.tsx` and cards (`transition-[opacity,transform]` + release `will-change` after reveal) while removing unused `swiper`.

### Pending Tasks
- [ ] Apply new Tier 1 schema & seed data in host terminal (`npm run db:setup && npm run db:seed`), then run `npm run typecheck && npm run build`.
- [ ] Optional next roadmap: **Tier 2** features (Certificate Verification Portal, Live Notice Bar, Member Project Showcase, Learning Hub).

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
In your host terminal inside `/home/mashrafi47/next-MCPIC`, apply the updated Tier 1 schema & RLS policies, seed the executive panels & achievements into PostgreSQL, and verify the TypeScript build:
```bash
cd /home/mashrafi47/next-MCPIC
npm run db:setup
npm run db:seed
npm run typecheck && npm run build
npm run dev
```
If TypeScript, ESLint, or `next build` reports any issues, share the output so they can be fixed immediately.
