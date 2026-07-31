import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';

const externalPackages = new Set([
  '@vitejs/plugin-react',
  'react',
  'react-dom/client',
  'vitepress',
  'vue',
]);

export default {
  plugins: [vue()],
  build: {
    lib: {
      entry: {
        index: fileURLToPath(new URL('./index.ts', import.meta.url)),
        'client/index': fileURLToPath(
          new URL('./client/index.ts', import.meta.url),
        ),
      },
      formats: ['es'],
      fileName: (_format: string, entryName: string) => `${entryName}.js`,
      cssFileName: 'style',
    },
    rollupOptions: {
      external: (id: string) =>
        externalPackages.has(id) || id.startsWith('shiki/'),
    },
  },
};
