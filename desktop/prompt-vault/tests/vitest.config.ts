import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // для интеграционных тестов с БД
    include: ['tests/**/*.{test,spec}.ts'],
    testTimeout: 10000,
  },
});