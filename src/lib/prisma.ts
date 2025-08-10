import { PrismaClient } from "@prisma/client";
import { MongoClient } from "mongodb";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

async function ensureDatabaseUrl(): Promise<void> {
  let url = process.env.DATABASE_URL as string | undefined;
  if (url) {
    try {
      const probe = new MongoClient(url);
      await probe.connect();
      await probe.close();
      return;
    } catch {
      // fallthrough to memory server
    }
  }
  if (process.env.NODE_ENV !== "production") {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const mongod = await MongoMemoryServer.create();
    process.env.DATABASE_URL = mongod.getUri();
    return;
  }
  throw new Error("DATABASE_URL is not set or unreachable");
}

// Ensure we have a working DATABASE_URL before instantiating PrismaClient
await ensureDatabaseUrl();

export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient({
  log: ["warn", "error"],
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
