import { describe, expect, it } from 'vitest';

import { richerSchemaRegistry, type JSONContent } from './index';

describe('richerSchemaRegistry', () => {
  it('round-trips an empty paragraph document through the core schema', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    };

    const parsed = richerSchemaRegistry.schema.nodeFromJSON(content);

    parsed.check();
    expect(parsed.toJSON()).toEqual(content);
    expect(richerSchemaRegistry.extensions.map(({ name }) => name)).toEqual([
      'doc',
      'paragraph',
      'text',
    ]);
  });
});
