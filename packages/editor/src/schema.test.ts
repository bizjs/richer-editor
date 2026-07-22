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
      content: [{ type: 'paragraph', attrs: { id: 'block-1' } }],
    };

    const parsed = richerSchemaRegistry.schema.nodeFromJSON(content);

    parsed.check();
    expect(parsed.toJSON()).toEqual(content);
    expect(richerSchemaRegistry.extensions.map(({ name }) => name)).toEqual([
      'starterKit',
      'uniqueID',
    ]);
  });

  it('round-trips a paragraph with text through the core schema', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { id: 'block-2' },
          content: [{ type: 'text', text: 'Hello Richer Editor' }],
        },
      ],
    };

    const parsed = richerSchemaRegistry.schema.nodeFromJSON(content);

    parsed.check();
    expect(parsed.toJSON()).toEqual(content);
  });

  it('round-trips StarterKit blocks and inline marks', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { id: 'heading-1', level: 2 },
          content: [
            { type: 'text', text: 'Richer', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' Editor', marks: [{ type: 'underline' }] },
          ],
        },
        {
          type: 'blockquote',
          attrs: { id: 'quote-1' },
          content: [
            {
              type: 'paragraph',
              attrs: { id: 'quote-paragraph-1' },
              content: [
                {
                  type: 'text',
                  text: 'Quoted text',
                  marks: [{ type: 'italic' }],
                },
              ],
            },
          ],
        },
        {
          type: 'bulletList',
          attrs: { id: 'list-1' },
          content: [
            {
              type: 'listItem',
              attrs: { id: 'list-item-1' },
              content: [
                {
                  type: 'paragraph',
                  attrs: { id: 'list-paragraph-1' },
                  content: [
                    {
                      type: 'text',
                      text: 'List item',
                      marks: [{ type: 'strike' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'orderedList',
          attrs: { id: 'ordered-list-1', start: 3, type: null },
          content: [
            {
              type: 'listItem',
              attrs: { id: 'ordered-list-item-1' },
              content: [
                {
                  type: 'paragraph',
                  attrs: { id: 'ordered-list-paragraph-1' },
                  content: [{ type: 'text', text: 'Third item' }],
                },
              ],
            },
          ],
        },
        {
          type: 'codeBlock',
          attrs: { id: 'code-block-1', language: null },
          content: [{ type: 'text', text: 'const answer = 42' }],
        },
        { type: 'horizontalRule', attrs: { id: 'rule-1' } },
        {
          type: 'paragraph',
          attrs: { id: 'paragraph-3' },
          content: [
            { type: 'text', text: 'inline code', marks: [{ type: 'code' }] },
            { type: 'text', text: ' and ' },
            {
              type: 'text',
              text: 'link',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://example.com',
                    target: '_blank',
                    rel: 'noopener noreferrer nofollow',
                    class: null,
                    title: null,
                  },
                },
              ],
            },
          ],
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

    expect(() => richerSchemaRegistry.schema.nodeFromJSON(content)).toThrow(
      /Unknown node type.*unsupportedBlock/,
    );
  });
});
