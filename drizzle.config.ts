import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Use a default connection string if DATABASE_URL is not provided
const databaseUrl = process.env.DATABASE_URL || 
  'postgres://postgres:postgres@localhost:5432/cinelog';

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});