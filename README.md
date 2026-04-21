## ScienceBasedPeptides site (Next.js + Postgres)

### Local setup

- **1) Install deps**

```bash
npm ci
```

- **2) Configure environment**

Copy `.env.example` to `.env.local` and set at least:

```bash
DATABASE_URL="<<Neon pooled URL>>"
JWT_SECRET="<<random secret>>"
```

- **3) Generate Prisma client**

```bash
npm run prisma:generate
```

- **4) Apply migrations**

```bash
npm run migrate:deploy
```

- **5) (Optional) Seed**

```bash
npm run seed
# or incremental catalog sync:
npm run seed:sync
```

### Development

```bash
npm run dev
```

### Vercel Preview vs Production (recommended)

- **Preview deployments**: set `DATABASE_URL` to a separate Neon database/branch in **Preview** env vars.
- **Production deployments**: set `DATABASE_URL` only in **Production** env vars.

### Safe rollout notes

- **Migrations**: Vercel builds run `prisma generate && next build` only. Apply schema changes separately via `npm run migrate:deploy` against the target database (Preview DB or Production DB).
- **Seeding**: `npm run seed` is destructive (truncates many tables). Prefer `npm run seed:sync` for incremental catalog updates, and never run destructive seed against Production DB.
