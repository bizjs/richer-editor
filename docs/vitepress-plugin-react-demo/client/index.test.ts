import { createApp, defineComponent } from 'vue';
import type { EnhanceAppContext, Theme } from 'vitepress';
import { describe, expect, it } from 'vitest';

import { ReactDemo, withReactDemo } from './index';

describe('withReactDemo', () => {
  it('extends the existing theme and registers the ReactDemo component', async () => {
    const baseTheme: Theme = {
      Layout: defineComponent({
        name: 'BaseLayout',
        template: '<main />',
      }),
    };
    const theme = withReactDemo(baseTheme);
    const app = createApp(defineComponent({ template: '<main />' }));

    expect(theme.extends).toBe(baseTheme);

    await theme.enhanceApp?.({ app } as EnhanceAppContext);

    expect(app.component('ReactDemo')).toBe(ReactDemo);
  });
});
