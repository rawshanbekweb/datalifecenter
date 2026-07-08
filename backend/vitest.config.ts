import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: './tests/global-setup.ts',
    setupFiles: ['./tests/setup-env.ts'],
    include: ['tests/**/*.test.ts'],
    // Hamma test fayllar bitta test bazasida ishlaydi — parallel emas
    fileParallelism: false,
    hookTimeout: 60000,
    testTimeout: 30000,
  },
});
