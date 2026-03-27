// prisma.config.ts
import "dotenv/config"; // Certifique-se de que esta linha é a primeira
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "", 
  },
});