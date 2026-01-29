import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Drizzle Kit runs outside Next.js, so load .env.local for DATABASE_URL
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
