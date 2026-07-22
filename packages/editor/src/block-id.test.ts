import { Editor } from '@tiptap/core';
import { Fragment, Slice } from '@tiptap/pm/model';
import { describe, expect, it, vi } from 'vitest';

import {
  normalizeBlockIds,
  richerSchemaRegistry,
  type JSONContent,
} from './index';

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('normalizeBlockIds', () => {
  it('generates UUID v4 block IDs by default', () => {
    const normalized = normalizeBlockIds({
      type: 'doc',
      content: [{ type: 'paragraph' }],
    });

    expect(normalized.content?.[0]?.attrs?.id).toMatch(UUID_V4_PATTERN);
  });

  it('adds an ID to an imported paragraph without mutating the input', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello Richer Editor' }],
        },
      ],
    };
    const generateId = vi.fn(() => 'block-1');

    const normalized = normalizeBlockIds(content, { generateId });

    expect(normalized).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { id: 'block-1' },
          content: [{ type: 'text', text: 'Hello Richer Editor' }],
        },
      ],
    });
    expect(content).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello Richer Editor' }],
        },
      ],
    });
    expect(generateId).toHaveBeenCalledOnce();
  });

  it('preserves an existing unique block ID', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { id: 'block-existing' },
          content: [{ type: 'text', text: 'Keep this identity' }],
        },
      ],
    };
    const generateId = vi.fn(() => 'block-replacement');

    const normalized = normalizeBlockIds(content, { generateId });

    expect(normalized).toEqual(content);
    expect(generateId).not.toHaveBeenCalled();
  });

  it('keeps the first block ID and replaces later duplicates', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { id: 'block-existing' },
          content: [{ type: 'text', text: 'Original block' }],
        },
        {
          type: 'paragraph',
          attrs: { id: 'block-existing' },
          content: [{ type: 'text', text: 'Copied block' }],
        },
      ],
    };
    const generateId = vi.fn(() => 'block-copy');

    const normalized = normalizeBlockIds(content, { generateId });

    expect(normalized).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { id: 'block-existing' },
          content: [{ type: 'text', text: 'Original block' }],
        },
        {
          type: 'paragraph',
          attrs: { id: 'block-copy' },
          content: [{ type: 'text', text: 'Copied block' }],
        },
      ],
    });
    expect(generateId).toHaveBeenCalledOnce();
  });

  it('retries when the generator returns an ID already used in the document', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { id: 'block-existing' },
          content: [{ type: 'text', text: 'Existing block' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'New block' }],
        },
      ],
    };
    const generateId = vi
      .fn()
      .mockReturnValueOnce('block-existing')
      .mockReturnValueOnce('block-new');

    const normalized = normalizeBlockIds(content, { generateId });

    expect(normalized.content?.map((block) => block.attrs?.id)).toEqual([
      'block-existing',
      'block-new',
    ]);
    expect(generateId).toHaveBeenCalledTimes(2);
  });

  it('assigns unique IDs to every StarterKit block node', () => {
    let sequence = 0;
    const generateId = vi.fn(() => `block-${(sequence += 1)}`);
    const normalized = normalizeBlockIds(
      {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Heading' }],
          },
          {
            type: 'blockquote',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Quote' }],
              },
            ],
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Bullet' }],
                  },
                ],
              },
            ],
          },
          {
            type: 'orderedList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Ordered' }],
                  },
                ],
              },
            ],
          },
          {
            type: 'codeBlock',
            content: [{ type: 'text', text: 'const answer = 42' }],
          },
          { type: 'horizontalRule' },
        ],
      },
      { generateId },
    );
    const ids: string[] = [];

    function collectIds(node: JSONContent): void {
      if (typeof node.attrs?.id === 'string') {
        ids.push(node.attrs.id);
      }

      node.content?.forEach(collectIds);
    }

    collectIds(normalized);

    expect(ids).toHaveLength(11);
    expect(new Set(ids)).toHaveLength(11);
    expect(generateId).toHaveBeenCalledTimes(11);
  });
});

describe('block IDs in editor transactions', () => {
  it('assigns an ID when a new paragraph is inserted', () => {
    const editor = new Editor({
      extensions: richerSchemaRegistry.extensions,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: { id: 'block-existing' },
            content: [{ type: 'text', text: 'Existing block' }],
          },
        ],
      },
    });

    try {
      editor.commands.insertContentAt(editor.state.doc.content.size, {
        type: 'paragraph',
        content: [{ type: 'text', text: 'New block' }],
      });

      const blocks = editor.getJSON().content;

      expect(blocks).toHaveLength(2);
      expect(blocks?.[0]?.attrs?.id).toBe('block-existing');
      expect(blocks?.[1]?.attrs?.id).toMatch(UUID_V4_PATTERN);
    } finally {
      editor.destroy();
    }
  });

  it('preserves a block ID when the block is moved', () => {
    const editor = new Editor({
      extensions: richerSchemaRegistry.extensions,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: { id: 'block-first' },
            content: [{ type: 'text', text: 'First block' }],
          },
          {
            type: 'paragraph',
            attrs: { id: 'block-second' },
            content: [{ type: 'text', text: 'Second block' }],
          },
        ],
      },
    });

    try {
      const firstBlock = editor.state.doc.child(0);
      const secondBlock = editor.state.doc.child(1);
      const moveSecondBlock = editor.state.tr
        .delete(firstBlock.nodeSize, firstBlock.nodeSize + secondBlock.nodeSize)
        .insert(0, secondBlock);

      editor.view.dispatch(moveSecondBlock);

      expect(editor.getJSON().content?.map((block) => block.attrs?.id)).toEqual(
        ['block-second', 'block-first'],
      );
    } finally {
      editor.destroy();
    }
  });

  it('assigns a new ID when a copied block is pasted', () => {
    const editor = new Editor({
      extensions: richerSchemaRegistry.extensions,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: { id: 'block-original' },
            content: [{ type: 'text', text: 'Copy me' }],
          },
        ],
      },
    });

    try {
      const copiedBlock = editor.state.doc.child(0);
      let pastedSlice = new Slice(Fragment.from(copiedBlock), 0, 0);
      // jsdom has no ClipboardEvent implementation. UniqueID only uses this
      // event to mark the following Slice transformation as a paste.
      const pasteEvent = new Event('paste') as ClipboardEvent;

      editor.view.someProp('handleDOMEvents', (handlers) => {
        handlers.paste?.(editor.view, pasteEvent);
      });

      editor.view.someProp('transformPasted', (transformPasted) => {
        pastedSlice = transformPasted(pastedSlice, editor.view, false);
      });

      editor.view.dispatch(
        editor.state.tr.insert(
          editor.state.doc.content.size,
          pastedSlice.content,
        ),
      );

      const blockIds = editor
        .getJSON()
        .content?.map((block) => block.attrs?.id);

      expect(blockIds).toHaveLength(2);
      expect(blockIds?.[0]).toBe('block-original');
      expect(blockIds?.[1]).toMatch(UUID_V4_PATTERN);
      expect(blockIds?.[1]).not.toBe('block-original');
    } finally {
      editor.destroy();
    }
  });

  it('keeps the original ID on the first half when a block is split', () => {
    const editor = new Editor({
      extensions: richerSchemaRegistry.extensions,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: { id: 'block-original' },
            content: [{ type: 'text', text: 'Hello world' }],
          },
        ],
      },
    });

    try {
      editor.commands.setTextSelection(6);

      expect(editor.commands.splitBlock()).toBe(true);

      const blocks = editor.getJSON().content;

      expect(blocks).toHaveLength(2);
      expect(blocks?.[0]?.attrs?.id).toBe('block-original');
      expect(blocks?.[1]?.attrs?.id).toMatch(UUID_V4_PATTERN);
      expect(editor.state.doc.child(0).textContent).toBe('Hello');
      expect(editor.state.doc.child(1).textContent).toBe(' world');
    } finally {
      editor.destroy();
    }
  });

  it('keeps the first block ID when adjacent blocks are merged', () => {
    const editor = new Editor({
      extensions: richerSchemaRegistry.extensions,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: { id: 'block-first' },
            content: [{ type: 'text', text: 'First' }],
          },
          {
            type: 'paragraph',
            attrs: { id: 'block-second' },
            content: [{ type: 'text', text: 'Second' }],
          },
        ],
      },
    });

    try {
      const secondBlockStart = editor.state.doc.child(0).nodeSize + 1;

      editor.commands.setTextSelection(secondBlockStart);

      expect(editor.commands.joinBackward()).toBe(true);
      expect(editor.state.doc.childCount).toBe(1);
      expect(editor.getJSON().content?.[0]?.attrs?.id).toBe('block-first');
      expect(editor.state.doc.child(0).textContent).toBe('FirstSecond');
    } finally {
      editor.destroy();
    }
  });
});
