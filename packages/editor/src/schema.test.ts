import { Extension } from '@tiptap/core';
import { DOMParser as ProseMirrorDOMParser } from '@tiptap/pm/model';
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
      content: [
        {
          type: 'paragraph',
          attrs: { id: 'block-1', textAlign: null },
        },
      ],
    };

    const parsed = richerSchemaRegistry.schema.nodeFromJSON(content);

    parsed.check();
    expect(parsed.toJSON()).toEqual(content);
    expect(richerSchemaRegistry.extensions.map(({ name }) => name)).toEqual([
      'starterKit',
      'codeBlock',
      'taskList',
      'taskItem',
      'tableKit',
      'callout',
      'details',
      'detailsSummary',
      'detailsContent',
      'highlight',
      'textStyle',
      'color',
      'subscript',
      'superscript',
      'textAlign',
      'typography',
      'placeholder',
      'characterCount',
      'uniqueID',
    ]);
  });

  it('round-trips a paragraph with text through the core schema', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { id: 'block-2', textAlign: null },
          content: [{ type: 'text', text: 'Hello Richer Editor' }],
        },
      ],
    };

    const parsed = richerSchemaRegistry.schema.nodeFromJSON(content);

    parsed.check();
    expect(parsed.toJSON()).toEqual(content);
  });

  it('round-trips a callout with its stable block ID and variant', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'callout',
          attrs: { id: 'callout-1', variant: 'warn' },
          content: [
            {
              type: 'paragraph',
              attrs: { id: 'callout-paragraph-1', textAlign: null },
              content: [{ type: 'text', text: 'Check this first.' }],
            },
          ],
        },
      ],
    };

    const parsed = richerSchemaRegistry.schema.nodeFromJSON(content);

    parsed.check();
    expect(parsed.toJSON()).toEqual(content);
  });

  it('uses the info variant when a callout omits its variant', () => {
    const parsed = richerSchemaRegistry.schema.nodeFromJSON({
      type: 'doc',
      content: [
        {
          type: 'callout',
          attrs: { id: 'callout-default' },
          content: [
            {
              type: 'paragraph',
              attrs: { id: 'callout-default-paragraph', textAlign: null },
            },
          ],
        },
      ],
    });

    parsed.check();
    expect(parsed.toJSON().content?.[0]?.attrs).toEqual({
      id: 'callout-default',
      variant: 'info',
    });
  });

  it('rejects callout JSON with an unsupported variant', () => {
    expect(() =>
      richerSchemaRegistry.schema.nodeFromJSON({
        type: 'doc',
        content: [
          {
            type: 'callout',
            attrs: { id: 'callout-invalid', variant: 'unknown' },
            content: [
              {
                type: 'paragraph',
                attrs: { id: 'callout-invalid-paragraph', textAlign: null },
              },
            ],
          },
        ],
      }),
    ).toThrow('Unsupported callout variant: unknown');
  });

  it('falls back to info when imported callout HTML has an unsupported variant', () => {
    const container = document.createElement('div');

    container.innerHTML =
      '<div data-type="callout" data-variant="unknown"><p>Imported</p></div>';

    const parsed = ProseMirrorDOMParser.fromSchema(
      richerSchemaRegistry.schema,
    ).parse(container);

    expect(parsed.firstChild?.attrs.variant).toBe('info');
  });

  it('round-trips StarterKit blocks and inline marks', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { id: 'heading-1', level: 2, textAlign: null },
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
              attrs: { id: 'quote-paragraph-1', textAlign: null },
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
                  attrs: { id: 'list-paragraph-1', textAlign: null },
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
                  attrs: {
                    id: 'ordered-list-paragraph-1',
                    textAlign: null,
                  },
                  content: [{ type: 'text', text: 'Third item' }],
                },
              ],
            },
          ],
        },
        {
          type: 'codeBlock',
          attrs: { id: 'code-block-1', language: 'javascript' },
          content: [{ type: 'text', text: 'const answer = 42' }],
        },
        { type: 'horizontalRule', attrs: { id: 'rule-1' } },
        {
          type: 'paragraph',
          attrs: { id: 'paragraph-3', textAlign: null },
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

  it('round-trips the supported extended inline marks', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { id: 'inline-marks-paragraph', textAlign: null },
          content: [
            {
              type: 'text',
              text: 'highlight',
              marks: [{ type: 'highlight', attrs: { color: '#fef08a' } }],
            },
            { type: 'text', text: ' ' },
            {
              type: 'text',
              text: 'color',
              marks: [{ type: 'textStyle', attrs: { color: '#2563eb' } }],
            },
            { type: 'text', text: 'H' },
            {
              type: 'text',
              text: '2',
              marks: [{ type: 'subscript' }],
            },
            { type: 'text', text: 'O x' },
            {
              type: 'text',
              text: '2',
              marks: [{ type: 'superscript' }],
            },
          ],
        },
      ],
    };

    const parsed = richerSchemaRegistry.schema.nodeFromJSON(content);

    parsed.check();
    expect(parsed.toJSON()).toEqual(content);
  });

  it('round-trips paragraph and heading text alignment', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { id: 'aligned-heading', level: 2, textAlign: 'center' },
          content: [{ type: 'text', text: 'Centered heading' }],
        },
        {
          type: 'paragraph',
          attrs: { id: 'aligned-paragraph', textAlign: 'right' },
          content: [{ type: 'text', text: 'Right-aligned paragraph' }],
        },
        {
          type: 'heading',
          attrs: { id: 'left-heading', level: 3, textAlign: 'left' },
          content: [{ type: 'text', text: 'Left-aligned heading' }],
        },
        {
          type: 'paragraph',
          attrs: { id: 'justified-paragraph', textAlign: 'justify' },
          content: [{ type: 'text', text: 'Justified paragraph' }],
        },
      ],
    };

    const parsed = richerSchemaRegistry.schema.nodeFromJSON(content);

    parsed.check();
    expect(parsed.toJSON()).toEqual(content);
  });

  it('round-trips checked and nested task items', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'taskList',
          attrs: { id: 'task-list-1' },
          content: [
            {
              type: 'taskItem',
              attrs: { id: 'task-item-1', checked: false },
              content: [
                {
                  type: 'paragraph',
                  attrs: { id: 'task-paragraph-1', textAlign: null },
                  content: [{ type: 'text', text: 'Write tests' }],
                },
                {
                  type: 'taskList',
                  attrs: { id: 'nested-task-list-1' },
                  content: [
                    {
                      type: 'taskItem',
                      attrs: { id: 'nested-task-item-1', checked: true },
                      content: [
                        {
                          type: 'paragraph',
                          attrs: {
                            id: 'nested-task-paragraph-1',
                            textAlign: null,
                          },
                          content: [{ type: 'text', text: 'Confirm Red' }],
                        },
                      ],
                    },
                  ],
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

  it('round-trips table headers, cells, spans, and column widths', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'table',
          attrs: { id: 'table-1' },
          content: [
            {
              type: 'tableRow',
              attrs: { id: 'table-row-1' },
              content: [
                {
                  type: 'tableHeader',
                  attrs: {
                    id: 'table-header-1',
                    colspan: 1,
                    rowspan: 1,
                    colwidth: [160],
                    align: null,
                  },
                  content: [
                    {
                      type: 'paragraph',
                      attrs: {
                        id: 'table-header-paragraph-1',
                        textAlign: null,
                      },
                      content: [{ type: 'text', text: 'Name' }],
                    },
                  ],
                },
                {
                  type: 'tableHeader',
                  attrs: {
                    id: 'table-header-2',
                    colspan: 1,
                    rowspan: 1,
                    colwidth: [200],
                    align: null,
                  },
                  content: [
                    {
                      type: 'paragraph',
                      attrs: {
                        id: 'table-header-paragraph-2',
                        textAlign: null,
                      },
                      content: [{ type: 'text', text: 'Status' }],
                    },
                  ],
                },
              ],
            },
            {
              type: 'tableRow',
              attrs: { id: 'table-row-2' },
              content: [
                {
                  type: 'tableCell',
                  attrs: {
                    id: 'table-cell-1',
                    colspan: 2,
                    rowspan: 1,
                    colwidth: [160, 200],
                    align: null,
                  },
                  content: [
                    {
                      type: 'paragraph',
                      attrs: {
                        id: 'table-cell-paragraph-1',
                        textAlign: null,
                      },
                      content: [{ type: 'text', text: 'Merged cell' }],
                    },
                  ],
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

  it('round-trips details summary and block content', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'details',
          attrs: { id: 'details-1' },
          content: [
            {
              type: 'detailsSummary',
              attrs: { id: 'details-summary-1' },
              content: [{ type: 'text', text: 'More information' }],
            },
            {
              type: 'detailsContent',
              attrs: { id: 'details-content-1' },
              content: [
                {
                  type: 'paragraph',
                  attrs: {
                    id: 'details-content-paragraph-1',
                    textAlign: null,
                  },
                  content: [{ type: 'text', text: 'Hidden details' }],
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
