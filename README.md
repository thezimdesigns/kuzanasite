# KUZANA SCEEZ: Digital Event Platform

Live programme, exhibitor directory and capture, media centre, visitor engagement and
permanent archive for KUZANA SCEEZ. Replaces the 2026 landing page at
**https://www.kuzana.org.zw**.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · PostgreSQL 17 ·
Prisma 7 · Better Auth · Garage (S3-compatible storage) · Docker · Coolify.

## Local development (Docker)

```bash
docker compose -f docker-compose.dev.yml up --build
```

- Site: http://localhost:3000, admin: http://localhost:3000/admin
- Dev admin: `admin@kuzana.test` / `kuzana-dev-admin-2026` (local only, from the compose file)
- Exhibitor form: http://localhost:3000/exhibitors/register?code=STAND2026
- Code changes hot-reload. Postgres is on `localhost:5440`, Garage S3 on `localhost:3900`.

After changing `prisma/schema.prisma`, create a migration from your machine
(with the dev stack running):

```bash
npx prisma migrate dev --name describe-change
```

Useful scripts: `npm run typecheck`, `npm run lint`, `npm run db:seed`.

## Production (Coolify, from GitHub)

The whole stack is defined in [`docker-compose.yml`](docker-compose.yml):

| Service     | What it does                                                       |
| ----------- | ------------------------------------------------------------------ |
| `app`       | Next.js server on port 3000                                        |
| `migrate`   | Runs `prisma migrate deploy` + seed on every deploy, then exits    |
| `db`        | PostgreSQL 17 (volume `kuzana-postgres`)                           |
| `garage`    | Object storage for uploads; configures its bucket and key itself  |
| `db-backup` | `pg_dump` every 6 hours into volume `kuzana-backups`, kept 14 days |

Uploaded files are served by the app at `/files/...` (cached by Cloudflare), so
Garage needs no public domain.

### First deployment

1. **Coolify → Projects → + New → Resource → Private Repository (with GitHub App)**,
   pick `thezimdesigns/kuzanasite`, branch `main`.
2. **Build Pack: Docker Compose**, compose file `/docker-compose.yml`.
3. **Environment Variables:** add everything from [`.env.example`](.env.example).
   Tick **"Build Variable"** for `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   and `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (they are compiled into the browser bundle).
4. **Domains:** on the `app` service set `https://www.kuzana.org.zw,https://kuzana.org.zw`,
   then enable the redirect to `www`.
5. Remove `kuzana.org.zw` / `www.kuzana.org.zw` from the **old landing-page resource**
   first (two resources cannot hold the same domain), then **Deploy**.
6. Sign in at `/admin` with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`, create staff
   accounts under **Users**, then clear `SEED_ADMIN_PASSWORD` in Coolify.
7. Enable **Auto Deploy** so every push to `main` redeploys.

Rollback: Coolify keeps previous images; redeploy an earlier commit from the
Deployments tab. The old PHP landing page can be re-attached to the domain if needed.

### Cloudflare DNS

| Type  | Name  | Content                | Proxy                               |
| ----- | ----- | ---------------------- | ----------------------------------- |
| A     | `@`   | Coolify server IPv4    | DNS only until first deploy, then Proxied |
| CNAME | `www` | `kuzana.org.zw`        | DNS only until first deploy, then Proxied |

Leave existing records (`portal`, mail, SES DKIM `._domainkey` CNAMEs) untouched.
SSL/TLS mode: **Full (strict)**. Turn **off** "Always Use HTTPS" in Cloudflare
(Coolify already redirects HTTP→HTTPS and needs plain HTTP for certificate renewals).

### Backups

- Database: dumps land in the `kuzana-backups` volume every 6 hours.
- Files: the `kuzana-garage-data` and `kuzana-garage-meta` volumes.
- Copy both off the server (e.g. `rclone` to Backblaze B2 or S3) on a schedule, and
  test a restore: `gunzip -c kuzana-YYYYMMDD-HHMM.sql.gz | psql -U kuzana kuzana`.

## How things work

- **Times** are stored in UTC and shown in Bulawayo time (UTC+2). "Live" and
  "Starting soon" are worked out from the clock; staff can override any event or
  session status (postponed, cancelled, venue changed) with a public note.
- **Roles** are enforced in every server action (`lib/permissions.ts`), not just hidden in the UI.
- **Exhibitor registration** at `/exhibitors/register` is unlisted and only opens with
  `?code=EXHIBITOR_ACCESS_CODE`. Print the QR code from **Admin → QR codes**.
  Submissions wait in **Admin → Exhibitors** for approval.
- **Completion links** (`/exhibitors/claim/<code>`) let an exhibitor finish their
  profile without an account; codes are stored hashed, expire after 14 days and can be revoked.
- **Messaging** sends Web Push and/or SES email only to people who opted in, after a
  preview showing the exact recipient count.
- **New edition:** Admin → Editions → create 2027, then "Make current"; all 2026
  content stays available under `/archive/2026`.
