import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/infrastructure/database/schema.ts',
  out: './src/infrastructure/database/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './dev-promptvault.db',
  },
  verbose: true,
  strict: true,
});