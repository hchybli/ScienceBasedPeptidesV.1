import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const rawConnectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  "";

if (!rawConnectionString) {
  throw new Error("Missing Postgres env var: DATABASE_URL / POSTGRES_PRISMA_URL / POSTGRES_URL.");
}

/** Use explicit sslmode=verify-full so `pg` does not warn about require/prefer/verify-ca aliases (Neon/Vercel defaults). */
function normalizePostgresConnectionString(url: string): string {
  try {
    const u = new URL(url);
    const mode = u.searchParams.get("sslmode");
    if (
      mode === null ||
      mode === "prefer" ||
      mode === "require" ||
      mode === "verify-ca"
    ) {
      u.searchParams.set("sslmode", "verify-full");
    }
    return u.toString();
  } catch {
    return url;
  }
}

const connectionString = normalizePostgresConnectionString(rawConnectionString);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({ connectionString });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

