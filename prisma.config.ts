import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // `prisma generate` runs at image build time without a database, so no hard requirement here;
    // migrate/seed fail clearly if DATABASE_URL is missing.
    url: process.env.DATABASE_URL ?? "",
  },
});
