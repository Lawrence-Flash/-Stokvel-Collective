import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // Unit tests mock this package. Alias it so Vite can resolve the import
      // before `prisma generate` has emitted packages/database/dist.
      '@stokvel/database': path.resolve(__dirname, 'test/database-stub.ts'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
  },
});
