// @vitest-environment node

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface PackageExport {
  import?: string;
  types?: string;
}

interface PackageManifest {
  exports: Record<string, PackageExport | string>;
}

function readPackageManifest(): PackageManifest {
  return JSON.parse(
    readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
  ) as PackageManifest;
}

describe('package exports', () => {
  it('only exposes built JavaScript, declarations, and CSS', () => {
    const manifest = readPackageManifest();
    const exportTargets = Object.values(manifest.exports).flatMap((value) =>
      typeof value === 'string' ? [value] : [value.import, value.types],
    );

    expect(exportTargets).not.toContain(undefined);
    expect(exportTargets).toEqual(
      expect.arrayContaining([
        './dist/index.js',
        './dist/index.d.ts',
        './dist/client/index.js',
        './dist/client/index.d.ts',
        './dist/style.css',
      ]),
    );
    expect(exportTargets.every((target) => target?.startsWith('./dist/'))).toBe(
      true,
    );
    expect(
      exportTargets.some(
        (target) =>
          target?.endsWith('.tsx') ||
          (target?.endsWith('.ts') && !target.endsWith('.d.ts')),
      ),
    ).toBe(false);
  });
});
