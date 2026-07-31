import { defineConfig } from 'vitepress';
import { reactDemo } from 'vitepress-plugin-react-demo';

export default defineConfig({
  extends: reactDemo(),
  base: process.env.DOCS_BASE ?? '/',
  srcDir: 'site',
  title: 'Richer Editor',
  description: 'A modern, extensible rich-text editor for React.',
  cleanUrls: true,
  themeConfig: {
    nav: [{ text: 'Home', link: '/' }],
    search: {
      provider: 'local',
    },
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/bizjs/richer-editor',
      },
    ],
  },
});
