import * as schema from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

// Initialize database if DATABASE_URL is provided
if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
  console.log("✅ Database connected via DATABASE_URL");
} else if (process.env.NODE_ENV === "production") {
  // DATABASE_URL is required in production
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
} else {
  // In development without DATABASE_URL, skip database connection
  console.warn(
    "⚠️  DATABASE_URL not set - running in development mode without database",
  );
}

// Export even if null - storage will handle it
export { db, pool };

