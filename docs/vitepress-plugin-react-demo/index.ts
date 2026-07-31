import react from '@vitejs/plugin-react';
import type { UserConfig } from 'vitepress';

export function reactDemo(): UserConfig {
  return {
    vite: {
      plugins: [react()],
    },
  };
}
