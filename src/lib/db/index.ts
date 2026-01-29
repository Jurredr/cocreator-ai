import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _client: ReturnType<typeof postgres> | null = null;
let _db: PostgresJsDatabase<typeof schema> | null = null;

function getClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!_client) {
    _client = postgres(connectionString, { max: 10 });
  }
  return _client;
}

/**
 * For server-side only. Use in Route Handlers and Server Components/Actions.
 * Lazy-initialized so build can succeed without DATABASE_URL.
 */
export const db: PostgresJsDatabase<typeof schema> = new Proxy(
  {} as PostgresJsDatabase<typeof schema>,
  {
    get(_, prop) {
      if (!_db) {
        _db = drizzle(getClient(), { schema });
      }
      return (_db as unknown as Record<string | symbol, unknown>)[prop];
    },
  }
);
export * from "./schema";
