import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '@bizjs/richer-editor/styles.css',
        replacement: fileURLToPath(
          new URL('../../packages/editor/src/styles.css', import.meta.url),
        ),
      },
      {
        find: '@bizjs/richer-editor',
        replacement: fileURLToPath(
          new URL('../../packages/editor/src/index.ts', import.meta.url),
        ),
      },
    ],
  },
});
