# Tech Stack Selection v1.0
**Project:** KGJ Custom Link Bio + Meta Tracking Hub  

**Status:** FINAL / LOCKED / Normalized by ADR-001, ADR-002, and ADR-005  
**Phase:** MVP / P0  
**Owner:** Engineering  
**Last Reviewed:** 2026-09-15  
**Approved Decisions:** 1A, 2A, 3A, 4A, 5A  
**Design Principle:** Keep it simple. Build the signal first.

---

## 1. Locked Technology Decisions

| Area | Locked Decision |
|---|---|
| Full-stack Framework | Next.js + TypeScript |
| Database / Managed Backend | Supabase |
| ORM | Drizzle ORM |
| Hosting | Vercel |
| Local Development | Supabase Local + Docker |

---

## 2. Final Recommended Stack

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Full-stack Framework | Next.js |
| Routing | Next.js App Router (`src/app`) |
| Server Runtime | Node.js for DB/Auth/Storage/Tracking paths |
| Package Manager | pnpm with committed lockfile |
| UI | React |
| Styling | Tailwind CSS |
| Admin Components | shadcn/ui |
| Database | PostgreSQL via Supabase |
| ORM / Migration Layer | Drizzle ORM |
| Authentication | Supabase Auth |
| File/Image Storage | Supabase Storage |
| Server API | Next.js Route Handlers / Server Actions |
| Browser Tracking | Meta Pixel |
| Server Tracking | Meta Conversions API |
| Analytics | Google Analytics 4 |
| Tag Management | Google Tag Manager |
| First-Party Event Store | PostgreSQL |
| Runtime Validation | Zod |
| Unit / Module Test | Vitest |
| Component Test | Testing Library |
| Browser / E2E Test | Playwright |
| Hosting | Vercel |
| Source Control | Git + GitHub |
| Local Environment | Supabase Local + Docker |

---

## 3. Next.js + TypeScript

Next.js menjadi application framework utama untuk:
- Public Link Bio,
- Admin CMS,
- server-side API,
- Meta CAPI endpoint,
- authenticated admin routes.

Satu codebase dipilih agar P0 tidak membutuhkan frontend/backend service terpisah.

Public rendering menggunakan Server Components secara default. Client Components
hanya digunakan ketika browser API atau interaksi membutuhkannya. Server Actions
digunakan untuk authenticated admin mutations; Route Handlers digunakan untuk
explicit HTTP boundaries seperti `POST /api/events`.

---

## 4. Supabase

Supabase digunakan untuk:
- PostgreSQL,
- Authentication,
- Storage.

Supabase berfungsi sebagai managed infrastructure, bukan sebagai pengganti application architecture.

---

## 5. Drizzle ORM

Canonical DB access path:

```text
Next.js Server
      ↓
Drizzle ORM
      ↓
Supabase PostgreSQL
```

Drizzle digunakan untuk:
- schema definition,
- migrations,
- typed queries,
- relational access.

---

## 6. Hosting

Application hosting dikunci menggunakan **Vercel** untuk P0.

Reasons:
- native Next.js deployment,
- HTTPS/CDN,
- preview deployments,
- environment variable management,
- low operational overhead.

Supabase tetap menjadi managed backend/data platform terpisah.

---

## 7. Local Development

Local environment dikunci menggunakan:

```text
Next.js Local
+
Supabase Local
+
Docker
```

Tujuan:
- dev database terpisah dari production,
- local auth/storage behavior,
- migration validation,
- safe development workflow.

Production database tidak digunakan sebagai default database untuk local development.

---

## 8. UI Stack

### Public
- React
- Tailwind CSS
- custom KGJ design

### Admin
- React
- Tailwind CSS
- shadcn/ui

Admin boleh memakai komponen generik, tetapi public Link Bio harus tetap mengikuti branding KGJ.

---

## 9. Tracking Stack

P0:

```text
Meta Pixel
Meta Conversions API
Google Tag Manager
Google Analytics 4
Internal First-Party Event Storage
```

Application tetap menjadi canonical source untuk:
- event_id,
- product context,
- branch context,
- attribution context.

GA4 dikirim melalui GTM saja. Meta Pixel, Meta CAPI, GTM, GA4, dan internal anonymous
events mengikuti approved consent state.

---

## 10. Validation

Zod digunakan untuk:
- form validation,
- API payload validation,
- environment validation,
- event validation.

---

## 11. Storage

Supabase Storage digunakan untuk:
- product images,
- campaign banners,
- optional brand assets.

File binary tidak disimpan langsung di PostgreSQL.

---

## 12. Authentication

Supabase Auth digunakan untuk Admin CMS.

P0 tidak membutuhkan complex RBAC.

Initial roles:
- admin
- technical_admin

`technical_admin` memiliki seluruh permission `admin` ditambah admin-profile
provisioning/deactivation dan technical diagnostics. Provider secret tetap
environment-only dan tidak dapat dibaca atau diedit melalui CMS.

---

## 13. Version Pinning

Versi berikut dipilih dan dipin pada 2026-09-15:

| Tool / package | Pinned version | Policy |
|---|---:|---|
| Node.js | `24` | Active LTS major; `package.json` membatasi `>=24.0.0 <25` |
| pnpm | `11.15.1` | Exact melalui `packageManager` dan engine policy |
| Next.js | `16.3.5` | Exact stable patch |
| React / React DOM | `19.3.0` | Exact stable patch |
| Tailwind CSS / PostCSS plugin | `4.3.3` | Exact; konfigurasi styling ditunda ke T0-04 |
| shadcn CLI | `4.21.0` | Exact; inisialisasi komponen ditunda ke T0-04 |
| TypeScript | `6.0.3` | Exact latest patch dalam rentang yang didukung lint stack |
| ESLint | `9.39.5` | Exact latest patch dalam rentang peer dependency Next lint stack |

Node.js dipin pada major LTS agar runtime menerima patch keamanan dalam lini 24,
sedangkan seluruh dependency npm menggunakan versi exact dan lockfile pnpm. Build
script dependency transitive hanya diizinkan melalui allowlist sempit di
`pnpm-workspace.yaml`.

TypeScript 6 dan ESLint 9 adalah compatibility holds: versi mayor berikutnya sudah
tersedia, tetapi belum diterima oleh peer dependency lint stack Next.js yang dipin.
Keduanya harus dievaluasi ulang saat lint stack resmi mendukung TypeScript 7 dan
ESLint 10; peringatan deprecation ESLint 9 saat resolusi paket diketahui dan tidak
dianggap sebagai izin untuk mengabaikan pembaruan tersebut.

## 14. Testing and CI

Setiap pull request harus menjalankan formatting check, lint, strict typecheck,
Vitest, database integration tests, Playwright smoke tests, dan production build.
Full cross-browser launch suite dijalankan sebelum production.

## 15. Deliberately Excluded from P0

Tidak digunakan kecuali scope berubah:
- microservices,
- Kubernetes,
- Kafka,
- mandatory Redis,
- Elasticsearch,
- separate backend framework,
- separate headless CMS,
- data warehouse,
- event streaming platform.

---

## 16. Tech Stack Status

**Next.js + TypeScript:** LOCKED  
**Supabase:** LOCKED  
**Drizzle ORM:** LOCKED  
**Vercel:** LOCKED  
**Supabase Local + Docker:** LOCKED  
**App Router + Node Runtime Boundary:** LOCKED via ADR-001  
**pnpm + Version Pinning Policy:** LOCKED via ADR-001  
**Testing Stack:** LOCKED via ADR-005  

**Tech Stack Selection v1.0:** FINAL
