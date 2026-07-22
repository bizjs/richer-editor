import { Extension } from '@tiptap/core';
import { describe, expect, it } from 'vitest';

import {
  createSchemaRegistry,
  richerSchemaRegistry,
  type JSONContent,
} from './index';

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

  it('round-trips a paragraph with text through the core schema', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello Richer Editor' }],
        },
      ],
    };

    const parsed = richerSchemaRegistry.schema.nodeFromJSON(content);

    parsed.check();
    expect(parsed.toJSON()).toEqual(content);
  });

  it('rejects duplicate extension names', () => {
    const duplicateParagraph = Extension.create({ name: 'paragraph' });

    expect(() => createSchemaRegistry([duplicateParagraph])).toThrow(
      'Duplicate extension name: paragraph',
    );
  });

  it('rejects unknown nodes instead of silently deleting them', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [{ type: 'unsupportedBlock' }],
    };

    expect(() =>
      richerSchemaRegistry.schema.nodeFromJSON(content),
    ).toThrow(/Unknown node type.*unsupportedBlock/);
  });
});
