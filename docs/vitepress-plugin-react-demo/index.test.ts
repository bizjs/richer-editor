import { describe, expect, it } from 'vitest';

import { reactDemo } from './index';

describe('reactDemo', () => {
  it('adds React TSX transformation to a VitePress config extension', () => {
    const config = reactDemo();
    const plugins = config.vite?.plugins?.flat(2) ?? [];

    expect(plugins).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'vite:react-babel' }),
        expect.objectContaining({ name: 'vite:react-refresh' }),
      ]),
    );
  });
});
