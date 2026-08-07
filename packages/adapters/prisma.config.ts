import { defineConfig } from "prisma/config";

const localPlaceholderUrl =
  "postgresql://nitipcuy_test:nitipcuy_test@127.0.0.1:55439/nitipcuy_test";

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? localPlaceholderUrl,
  },
  migrations: {
    path: "prisma/migrations",
  },
  schema: "prisma/schema.prisma",
});
