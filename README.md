# MANDE frontend

The web app for MANDE, a platform that connects manufacturers with production jobs. It is a Next.js 16 (App Router) app on React 19, styled with Tailwind CSS v4. Server data comes from the MANDE API (`../mande-backend`) through Axios and TanStack Query, live updates come over a Socket.IO connection to the same API, and editorial content (FAQs, legal documents, knowledge base, blog) comes from Sanity CMS (studio in `../mande-sanity`).

One app serves four surfaces, each in its own route group under `app/`:

| Surface | URL | Route group | Who uses it |
| --- | --- | --- | --- |
| Website | `/` | `app/(website)` | Public visitors: home, open jobs, services, plans, FAQ, blog, knowledge base, legal pages |
| Manufacturer platform | `/manufacturer` | `app/(manufacturer)` | Manufacturers: jobs, wallet, profile, settings |
| Admin platform | `/admin` | `app/(admin)` | MANDE staff (project leads) |
| Super admin platform | `/super-admin` | `app/(superAdmin)` | Platform owners: revenue, reporting, transactions, settings |

`/manufacturer`, `/admin` and `/super-admin` redirect to their `/dashboard` page (see `next.config.ts`). Each has a `/login` page.

## Requirements

- **Node.js 24** (via nvm works). There is no `.nvmrc` or `engines` field in this repo; the backend requires Node `>=22.12` and deploys on Node 24, so use the same here.
- **npm** (ships with Node; `package-lock.json` is committed).
- **The MANDE API** running on `http://localhost:4000`. See [../mande-backend/README.md](../mande-backend/README.md). It needs MongoDB (`docker compose up -d mongo` in `mande-backend`).
- **Sanity project** (optional). The app reads a public, read-only dataset and falls back to project `iprkoda4` / dataset `production` when the variables are unset. You only need your own if you want to point at a different project.

## Setup

```bash
nvm use 24        # or: nvm install 24
npm install
cp .env.example .env.local
npm run dev
```

Then open:

- Website: http://localhost:3010
- Manufacturer: http://localhost:3010/manufacturer/login
- Admin: http://localhost:3010/admin/login
- Super admin: http://localhost:3010/super-admin/login

### Environment variables

Next.js reads `.env.local`. A `.env.example` (and an identical `.env.local.example`) exists in the project folder, but `.gitignore` ignores `.env*`, so neither is committed. If you cloned the repo and don't have one, create `.env.local` from this sample:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3010
# Sanity CMS (public, read-only dataset)
NEXT_PUBLIC_SANITY_PROJECT_ID=your-sanity-project-id
NEXT_PUBLIC_SANITY_DATASET=production
```

| Variable | Purpose | Required | Default | Read in |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the REST API | No (yes in production) | `http://localhost:4000/api/v1` | `lib/api.ts` |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO server (the API origin, no path) | No (yes in production) | `http://localhost:4000` | `lib/socket.ts` |
| `NEXT_PUBLIC_APP_URL` | Public site URL, used for the sitemap, robots, SEO and absolute links | No (yes in production) | `http://localhost:3010` | `lib/site.ts` |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project to read content from | No | `iprkoda4` | `lib/cms/client.ts` |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset | No | `production` | `lib/cms/client.ts` |
| `NEXT_PUBLIC_SENTRY_DSN` | Where errors and traces go (the `mande-frontend` Sentry project). Public. Empty: Sentry is off | No | none | `lib/sentry.ts` |
| `SENTRY_AUTH_TOKEN` | Build only, never public: a Sentry org auth token that uploads source maps on `npm run build`, so production errors show the real code. Without it the upload is skipped | No (yes for production builds) | none | `next.config.ts` |
| `DEV_ORIGINS` | Extra hostnames the dev server answers besides `localhost`, comma-separated (e.g. local names from `../local-proxy`). Only for your own machine | No | none | `next.config.ts` |
| `NEXT_DIST_DIR` | Build output folder. Only the browser tests set it (`.next-e2e`) | No | `.next` | `next.config.ts` |

`NEXT_PUBLIC_*` values are inlined into the browser bundle at build time, so never put secrets in them, and rebuild after changing them.

Not read by the app: `.env.example` also lists `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` and `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY`, and no code uses them today. Cloudinary credentials do not belong here either; uploads go through the API.

### Test accounts

Accounts come from the backend seed. In `mande-backend` run `npm run seed`. Every seeded account uses the password `Password123!`, for example:

| Surface | Email |
| --- | --- |
| Manufacturer | `demi@majeurs.ng` |
| Admin (project lead) | `lead@mande.com.ng` |
| Super admin | `superadmin@mande.com.ng` |

The seed prints the full list when it finishes.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the dev server on http://localhost:3010 (the port is fixed, so it never clashes with `mande-shop` on 3020) |
| `npm run build` | Production build (`next build`) |
| `npm run start` | Serves the production build (run `build` first) on port 3000, or `PORT` if set |
| `npm run lint` | Runs ESLint over the project |
| `npm run test:e2e` | Runs the Playwright browser tests in `e2e/` |

### Browser tests (`npm run test:e2e`)

The tests never touch your data or your running servers:

1. Global setup (`e2e/global-setup.ts`) runs `npm run e2e:reset` then `npm run seed` in `../mande-backend` against a separate database, `mongodb://127.0.0.1:27017/mande_e2e`. The reset script refuses any other database.
2. Playwright starts its own API on port **4100** (email off, scheduler off; other settings from `mande-backend/.env`) and its own Next.js dev server on port **3100**, built into `.next-e2e` so it can run beside your `npm run dev`.
3. Cloudinary uploads are intercepted in the browser (`e2e/fixtures.ts`).

Needs: local MongoDB running, `../mande-backend` installed (`npm install` there), and the Playwright browser (`npx playwright install chromium`, once). Use `npm run test:e2e -- --ui` to watch the tests run.

## Project structure

```
app/            Routes. One route group per surface: (website), (manufacturer), (admin), (superAdmin)
components/     UI by surface (mainWebsite, manufacturerPlatform, adminPlatform, superAdminPlatform),
                plus common, customTable (DataTable), form, providers and ui (shadcn-style primitives)
hooks/          Shared React hooks (auth, current user, plans, points, ...)
lib/            api.ts (Axios client, token refresh), socket.ts (Socket.IO), queryClient.ts, queryKeys.ts,
                services/ (one module per API area), mappers/, cms/ (Sanity queries), types/, site.ts, seo.ts
constant/       Static config: navigation, plans, job workflow, copy
e2e/            Playwright tests
public/         Logos, fonts, images
```

For more detail see [../STRUCTURE.md](../STRUCTURE.md).

## Conventions

The full rules are in [CLAUDE.md](CLAUDE.md) and [AGENTS.md](AGENTS.md). In short:

- **This is not the Next.js you may know.** Version 16 has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before writing code, and heed deprecation notices.
- Manufacturer-platform forms live in `components/manufacturerPlatform/form/`.
- Every table uses `DataTable` and its helpers from `@/components/customTable`. No hand-rolled `<table>` markup or per-page pagination; extend `DataTable` with an optional prop instead.
- No em dash in any user-facing copy (UI, toasts, website, CMS content).
- Every form submit handler uses `try`/`catch` (and `finally` for loading state) and shows `toast.error(...)` on failure.
- Server data loads with a `Skeleton` (`@/components/ui/skeleton`) sized like the value. Hardcoded copy renders immediately. No full-page spinners.
- No sample, mock or placeholder data: skeleton while loading, an empty state when empty, an error message on failure.

## Deployment

There is no deployment config in this repo: no `vercel.json`, Dockerfile or CI workflow. (`.gitignore` ignores `.vercel`, but nothing else points to a host.) The backend's own deployment (`Dockerfile`, `deploy/`, the VPS workflow) lives in `mande-backend` and does not build this app.

Wherever it is hosted, a production build needs:

- `NEXT_PUBLIC_API_URL` set to the production API, e.g. `https://<api-host>/api/v1`
- `NEXT_PUBLIC_SOCKET_URL` set to the production API origin
- `NEXT_PUBLIC_APP_URL` set to the public site URL
- `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` if not using the defaults

These are baked in at build time, so set them before `npm run build`. The API must also allow the site's origin for CORS and cookies (the backend's `APP_URL` / `CORS_EXTRA_ORIGINS`), because the login refresh token is an httpOnly cookie.

## Troubleshooting

**Native binary errors after copying the project between Macs** (for example a quarantined or "damaged" `.node` / SWC / lightningcss binary, often after AirDrop). Clear the quarantine flag and reinstall:

```bash
xattr -dr com.apple.quarantine .
rm -rf node_modules && npm install
```

**`npm: command not found`**. nvm isn't loaded in this shell:

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 24
```

**Build logs `Website fetch /plans failed` (or `/open-jobs`)**. Website pages fetch plans and open jobs from the API while they prerender. If the API isn't running at build time those fetches fail, the build still finishes, and the pages fall back to their error or empty states until they revalidate. Start the backend before `npm run build` to prerender real data.

