import { createElement, useEffect } from 'react';
import { createApp, defineComponent, h, nextTick, shallowRef } from 'vue';
import { describe, expect, it, vi } from 'vitest';

import ReactDemo from './ReactDemo.vue';

describe('ReactDemo', () => {
  it('renders a React component inside a VitePress Vue page', async () => {
    const host = document.createElement('div');
    const Demo = () => createElement('p', null, 'Rendered by React');
    const app = createApp(
      defineComponent({
        render: () => h(ReactDemo, { component: Demo }),
      }),
    );

    app.mount(host);

    await vi.waitFor(() => {
      expect(host.textContent).toContain('Rendered by React');
    });

    app.unmount();
  });

  it('renders the replacement when the React component changes', async () => {
    const host = document.createElement('div');
    const FirstDemo = () => createElement('p', null, 'First demo');
    const SecondDemo = () => createElement('p', null, 'Second demo');
    const component = shallowRef(FirstDemo);
    const app = createApp(
      defineComponent({
        render: () => h(ReactDemo, { component: component.value }),
      }),
    );

    app.mount(host);
    await vi.waitFor(() => {
      expect(host.textContent).toContain('First demo');
    });

    component.value = SecondDemo;
    await nextTick();

    await vi.waitFor(() => {
      expect(host.textContent).toContain('Second demo');
    });

    app.unmount();
  });

  it('unmounts the React tree when the Vue component is removed', async () => {
    const host = document.createElement('div');
    const onUnmount = vi.fn();
    const Demo = () => {
      useEffect(() => onUnmount, []);

      return createElement('p', null, 'Disposable demo');
    };
    const app = createApp(
      defineComponent({
        render: () => h(ReactDemo, { component: Demo }),
      }),
    );

    app.mount(host);
    await vi.waitFor(() => {
      expect(host.textContent).toContain('Disposable demo');
    });

    app.unmount();

    await vi.waitFor(() => {
      expect(onUnmount).toHaveBeenCalledOnce();
    });
  });

  it('switches from the React preview to safely rendered source code', async () => {
    const host = document.createElement('div');
    const Demo = () => createElement('p', null, 'Preview content');
    const source = '</code><script>window.injected = true</script>';
    const app = createApp(
      defineComponent({
        render: () =>
          h(ReactDemo, {
            component: Demo,
            source,
            title: 'Safe demo',
          }),
      }),
    );

    app.mount(host);
    await vi.waitFor(() => {
      expect(host.textContent).toContain('Preview content');
    });

    const tabs = host.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    expect(tabs).toHaveLength(2);
    expect(tabs[0]?.textContent?.trim()).toBe('Preview');
    expect(tabs[0]?.getAttribute('aria-selected')).toBe('true');

    tabs[1]?.click();
    await nextTick();

    expect(tabs[1]?.getAttribute('aria-selected')).toBe('true');
    expect(host.textContent).toContain('Safe demo');
    expect(host.textContent).toContain(source);
    expect(host.querySelector('script')).toBeNull();

    app.unmount();
  });

  it('moves between view tabs with arrow, Home, and End keys', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const Demo = () => createElement('p', null, 'Keyboard demo');
    const app = createApp(
      defineComponent({
        render: () =>
          h(ReactDemo, {
            component: Demo,
            source: 'export default function Demo() {}',
          }),
      }),
    );

    app.mount(host);
    const tabs = host.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabs[0]?.focus();
    tabs[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    await nextTick();

    expect(tabs[1]?.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(tabs[1]);

    tabs[1]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true }),
    );
    await nextTick();
    expect(document.activeElement).toBe(tabs[0]);

    tabs[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true }),
    );
    await nextTick();
    expect(document.activeElement).toBe(tabs[1]);

    tabs[1]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    );
    await nextTick();
    expect(document.activeElement).toBe(tabs[0]);

    app.unmount();
    host.remove();
  });

  it('copies the displayed source and announces success', async () => {
    const host = document.createElement('div');
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const source = 'export default function CopyDemo() {}';
    const Demo = () => createElement('p', null, 'Copy demo');
    const app = createApp(
      defineComponent({
        render: () => h(ReactDemo, { component: Demo, source }),
      }),
    );

    app.mount(host);
    const copyButton = host.querySelector<HTMLButtonElement>(
      'button[aria-label="Copy source"]',
    );

    expect(copyButton).not.toBeNull();
    copyButton?.click();

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(source);
      expect(host.querySelector('[role="status"]')?.textContent).toContain(
        'Copied',
      );
    });

    app.unmount();
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('announces when copying source fails', async () => {
    const host = document.createElement('div');
    const writeText = vi.fn().mockRejectedValue(new Error('Clipboard denied'));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const Demo = () => createElement('p', null, 'Failed copy demo');
    const app = createApp(
      defineComponent({
        render: () =>
          h(ReactDemo, {
            component: Demo,
            source: 'export default function Demo() {}',
          }),
      }),
    );

    app.mount(host);
    host
      .querySelector<HTMLButtonElement>('button[aria-label="Copy source"]')
      ?.click();

    await vi.waitFor(() => {
      expect(host.querySelector('[role="status"]')?.textContent).toContain(
        'Copy failed',
      );
    });

    app.unmount();
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('loads syntax highlighting only after the source tab is opened', async () => {
    const host = document.createElement('div');
    const source = 'export default function HighlightDemo() { return <p /> }';
    const Demo = () => createElement('p', null, 'Highlight demo');
    const app = createApp(
      defineComponent({
        render: () => h(ReactDemo, { component: Demo, source }),
      }),
    );

    app.mount(host);
    expect(host.querySelector('pre.shiki')).toBeNull();

    const sourceTab =
      host.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1];
    sourceTab?.click();

    await vi.waitFor(
      () => {
        expect(host.querySelector('pre.shiki')).not.toBeNull();
        expect(host.textContent).toContain('HighlightDemo');
      },
      { timeout: 5_000 },
    );

    app.unmount();
  });
});
