import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalDb = globalThis as unknown as { prisma?: PrismaClient };
export function getPrisma(): PrismaClient {
  if (globalDb.prisma) return globalDb.prisma;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required.");
  globalDb.prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  return globalDb.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, key) {
    const db = getPrisma();
    const value = Reflect.get(db, key);
    return typeof value === "function" ? value.bind(db) : value;
  },
});
