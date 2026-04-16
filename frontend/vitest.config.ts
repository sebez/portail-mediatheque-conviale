import { defineConfig } from 'vitest/config';

// Switches pool from 'forks' to 'threads' to avoid worker timeout on Windows.
// The Angular @angular/build:unit-test builder merges this with its own config.
export default defineConfig({
  test: {
    pool: 'threads',
  },
});
