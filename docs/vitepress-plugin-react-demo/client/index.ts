import type { Plugin } from 'vue';
import type { Theme } from 'vitepress';

import ReactDemo from './ReactDemo.vue';
import './style.css';

export { ReactDemo };

export const ReactDemoPlugin = {
  install(app) {
    app.component('ReactDemo', ReactDemo);
  },
} satisfies Plugin;

export function withReactDemo(theme: Theme): Theme {
  return {
    extends: theme,
    enhanceApp({ app }) {
      app.use(ReactDemoPlugin);
    },
  };
}
