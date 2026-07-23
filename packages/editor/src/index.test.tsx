import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { createDocument, RicherEditor, type RicherDocument } from './index';

interface TestEditorChange {
  document: RicherDocument;
}

function makeDocument(text: string, id: string): RicherDocument {
  return createDocument({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        attrs: { id, textAlign: null },
        content: text ? [{ type: 'text', text }] : [],
      },
    ],
  });
}

function makeDetailsDocument(): RicherDocument {
  return createDocument({
    type: 'doc',
    content: [
      {
        type: 'details',
        attrs: { id: 'details' },
        content: [
          {
            type: 'detailsSummary',
            attrs: { id: 'details-summary' },
            content: [{ type: 'text', text: 'More information' }],
          },
          {
            type: 'detailsContent',
            attrs: { id: 'details-content' },
            content: [
              {
                type: 'paragraph',
                attrs: { id: 'details-paragraph', textAlign: null },
                content: [{ type: 'text', text: 'Hidden details' }],
              },
            ],
          },
        ],
      },
    ],
  });
}

function makeCodeDocument(
  language = 'javascript',
  text = 'const answer = 42',
): RicherDocument {
  return createDocument({
    type: 'doc',
    content: [
      {
        type: 'codeBlock',
        attrs: { id: 'code-block', language },
        content: [{ type: 'text', text }],
      },
    ],
  });
}

function makeCalloutDocument(variant = 'info'): RicherDocument {
  return createDocument({
    type: 'doc',
    content: [
      {
        type: 'callout',
        attrs: { id: 'callout', variant },
        content: [
          {
            type: 'paragraph',
            attrs: { id: 'callout-paragraph', textAlign: null },
            content: [{ type: 'text', text: 'Important information' }],
          },
        ],
      },
    ],
  });
}

function insertTextAtEnd(editor: HTMLElement, text: string): void {
  const paragraph = editor.querySelector('p');

  if (!paragraph) {
    throw new Error('Expected the editor to contain a paragraph.');
  }

  paragraph.textContent = `${paragraph.textContent ?? ''}${text}`;
  fireEvent.input(editor, { data: text, inputType: 'insertText' });
}

function setCaretOffset(editor: HTMLElement, offset: number): void {
  const text = editor.querySelector('p')?.firstChild;
  const selection = window.getSelection();

  if (!text || !selection) {
    throw new Error('Expected the editor to contain selectable text.');
  }

  const range = document.createRange();

  editor.focus();
  range.setStart(text, offset);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  document.dispatchEvent(new Event('selectionchange'));
}

function selectText(editor: HTMLElement, start: number, end: number): void {
  const paragraph = editor.querySelector('p');
  const text = paragraph
    ? document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT).nextNode()
    : null;
  const selection = window.getSelection();

  if (!text || !selection) {
    throw new Error('Expected the editor to contain selectable text.');
  }

  const range = document.createRange();

  editor.focus();
  range.setStart(text, start);
  range.setEnd(text, end);
  selection.removeAllRanges();
  selection.addRange(range);
  document.dispatchEvent(new Event('selectionchange'));
}

function selectEditorContents(editor: HTMLElement): void {
  const selection = window.getSelection();

  if (!selection) {
    throw new Error('Expected the editor to provide a document selection.');
  }

  const range = document.createRange();

  editor.focus();
  range.selectNodeContents(editor);
  selection.removeAllRanges();
  selection.addRange(range);
  document.dispatchEvent(new Event('selectionchange'));
}

describe('RicherEditor public component', () => {
  it('renders an accessible editor surface', () => {
    render(<RicherEditor />);

    expect(
      screen.getByRole('textbox', { name: 'Document editor' }),
    ).toBeInTheDocument();
  });

  it('applies bold formatting from the enabled toolbar', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();

    render(
      <RicherEditor
        defaultDocument={makeDocument('Draft', 'block-toolbar')}
        features={{ toolbar: true }}
        onChange={onChange}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    selectText(editor, 0, 5);
    fireEvent.click(screen.getByRole('button', { name: 'Bold' }));

    await waitFor(() => {
      expect(onChange.mock.calls.at(-1)?.[0].document.content).toEqual({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: { id: 'block-toolbar', textAlign: null },
            content: [
              {
                type: 'text',
                marks: [{ type: 'bold' }],
                text: 'Draft',
              },
            ],
          },
        ],
      });
    });
  });

  it('applies italic formatting from the enabled toolbar', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();

    render(
      <RicherEditor
        defaultDocument={makeDocument('Draft', 'block-toolbar-italic')}
        features={{ toolbar: true }}
        onChange={onChange}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    selectText(editor, 0, 5);
    fireEvent.click(screen.getByRole('button', { name: 'Italic' }));

    await waitFor(() => {
      expect(
        onChange.mock.calls.at(-1)?.[0].document.content.content?.[0]
          ?.content?.[0]?.marks,
      ).toEqual([{ type: 'italic' }]);
    });
  });

  it('applies underline formatting from the enabled toolbar', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();

    render(
      <RicherEditor
        defaultDocument={makeDocument('Draft', 'block-toolbar-underline')}
        features={{ toolbar: true }}
        onChange={onChange}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    selectText(editor, 0, 5);
    fireEvent.click(screen.getByRole('button', { name: 'Underline' }));

    await waitFor(() => {
      expect(
        onChange.mock.calls.at(-1)?.[0].document.content.content?.[0]
          ?.content?.[0]?.marks,
      ).toEqual([{ type: 'underline' }]);
    });
  });

  it('applies strikethrough formatting from the enabled toolbar', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();

    render(
      <RicherEditor
        defaultDocument={makeDocument('Draft', 'block-toolbar-strike')}
        features={{ toolbar: true }}
        onChange={onChange}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    selectText(editor, 0, 5);
    fireEvent.click(screen.getByRole('button', { name: 'Strikethrough' }));

    await waitFor(() => {
      expect(
        onChange.mock.calls.at(-1)?.[0].document.content.content?.[0]
          ?.content?.[0]?.marks,
      ).toEqual([{ type: 'strike' }]);
    });
  });

  it('applies inline code formatting from the enabled toolbar', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();

    render(
      <RicherEditor
        defaultDocument={makeDocument('Draft', 'block-toolbar-code')}
        features={{ toolbar: true }}
        onChange={onChange}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    selectText(editor, 0, 5);
    fireEvent.click(screen.getByRole('button', { name: 'Inline code' }));

    await waitFor(() => {
      expect(
        onChange.mock.calls.at(-1)?.[0].document.content.content?.[0]
          ?.content?.[0]?.marks,
      ).toEqual([{ type: 'code' }]);
    });
  });

  it('clears inline formatting from the enabled toolbar', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();
    const formattedDocument = createDocument({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { id: 'block-toolbar-clear', textAlign: null },
          content: [
            {
              type: 'text',
              marks: [{ type: 'bold' }, { type: 'italic' }],
              text: 'Draft',
            },
          ],
        },
      ],
    });

    render(
      <RicherEditor
        defaultDocument={formattedDocument}
        features={{ toolbar: true }}
        onChange={onChange}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    selectText(editor, 0, 5);
    fireEvent.click(screen.getByRole('button', { name: 'Clear formatting' }));

    await waitFor(() => {
      expect(
        onChange.mock.calls.at(-1)?.[0].document.content.content?.[0]
          ?.content?.[0],
      ).toEqual({ type: 'text', text: 'Draft' });
    });
  });

  it('converts a paragraph to a level-two heading from the toolbar', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();

    render(
      <RicherEditor
        defaultDocument={makeDocument('Section', 'block-toolbar-heading')}
        features={{ toolbar: true }}
        onChange={onChange}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    selectText(editor, 0, 7);
    fireEvent.click(screen.getByRole('button', { name: 'Heading 2' }));

    await waitFor(() => {
      expect(
        onChange.mock.calls.at(-1)?.[0].document.content.content?.[0],
      ).toEqual({
        type: 'heading',
        attrs: {
          id: 'block-toolbar-heading',
          level: 2,
          textAlign: null,
        },
        content: [{ type: 'text', text: 'Section' }],
      });
    });
  });

  it('wraps a paragraph in a bulleted list from the toolbar', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();

    render(
      <RicherEditor
        defaultDocument={makeDocument('Item', 'block-toolbar-bullet')}
        features={{ toolbar: true }}
        onChange={onChange}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    selectText(editor, 0, 4);
    fireEvent.click(screen.getByRole('button', { name: 'Bulleted list' }));

    await waitFor(() => {
      expect(
        onChange.mock.calls.at(-1)?.[0].document.content.content?.[0],
      ).toMatchObject({
        type: 'bulletList',
        attrs: { id: expect.any(String) },
        content: [
          {
            type: 'listItem',
            attrs: { id: expect.any(String) },
            content: [
              {
                type: 'paragraph',
                attrs: { id: 'block-toolbar-bullet', textAlign: null },
                content: [{ type: 'text', text: 'Item' }],
              },
            ],
          },
        ],
      });
    });
  });

  it('wraps a paragraph in an ordered list from the toolbar', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();

    render(
      <RicherEditor
        defaultDocument={makeDocument('First', 'block-toolbar-ordered')}
        features={{ toolbar: true }}
        onChange={onChange}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    selectText(editor, 0, 5);
    fireEvent.click(screen.getByRole('button', { name: 'Ordered list' }));

    await waitFor(() => {
      expect(
        onChange.mock.calls.at(-1)?.[0].document.content.content?.[0],
      ).toMatchObject({
        type: 'orderedList',
        attrs: { id: expect.any(String) },
        content: [
          {
            type: 'listItem',
            attrs: { id: expect.any(String) },
            content: [
              {
                type: 'paragraph',
                attrs: { id: 'block-toolbar-ordered', textAlign: null },
                content: [{ type: 'text', text: 'First' }],
              },
            ],
          },
        ],
      });
    });
  });

  it('wraps a paragraph in a task list from the toolbar', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();

    render(
      <RicherEditor
        defaultDocument={makeDocument('Todo', 'block-toolbar-task')}
        features={{ toolbar: true }}
        onChange={onChange}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    selectText(editor, 0, 4);
    fireEvent.click(screen.getByRole('button', { name: 'Task list' }));

    await waitFor(() => {
      expect(
        onChange.mock.calls.at(-1)?.[0].document.content.content?.[0],
      ).toMatchObject({
        type: 'taskList',
        attrs: { id: expect.any(String) },
        content: [
          {
            type: 'taskItem',
            attrs: { checked: false, id: expect.any(String) },
            content: [
              {
                type: 'paragraph',
                attrs: { id: 'block-toolbar-task', textAlign: null },
                content: [{ type: 'text', text: 'Todo' }],
              },
            ],
          },
        ],
      });
    });
  });

  it('wraps a paragraph in a blockquote from the toolbar', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();

    render(
      <RicherEditor
        defaultDocument={makeDocument('Quoted', 'block-toolbar-quote')}
        features={{ toolbar: true }}
        onChange={onChange}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    selectText(editor, 0, 6);
    fireEvent.click(screen.getByRole('button', { name: 'Blockquote' }));

    await waitFor(() => {
      expect(
        onChange.mock.calls.at(-1)?.[0].document.content.content?.[0],
      ).toMatchObject({
        type: 'blockquote',
        attrs: { id: expect.any(String) },
        content: [
          {
            type: 'paragraph',
            attrs: { id: 'block-toolbar-quote', textAlign: null },
            content: [{ type: 'text', text: 'Quoted' }],
          },
        ],
      });
    });
  });

  it('wraps a paragraph in an info callout from the toolbar', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();

    render(
      <RicherEditor
        defaultDocument={makeDocument('Remember this', 'callout-paragraph')}
        features={{ toolbar: true }}
        onChange={onChange}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    selectText(editor, 0, 13);
    fireEvent.click(screen.getByRole('button', { name: 'Callout' }));

    await waitFor(() => {
      expect(
        onChange.mock.calls.at(-1)?.[0].document.content.content?.[0],
      ).toMatchObject({
        type: 'callout',
        attrs: { id: expect.any(String), variant: 'info' },
        content: [
          {
            type: 'paragraph',
            attrs: { id: 'callout-paragraph', textAlign: null },
            content: [{ type: 'text', text: 'Remember this' }],
          },
        ],
      });
    });
  });

  it('cycles the callout variant from its accessible style control', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();

    render(
      <RicherEditor
        defaultDocument={makeCalloutDocument()}
        onChange={onChange}
      />,
    );
    const styleControl = await screen.findByRole('button', {
      name: 'Callout style: info. Activate to change',
    });

    expect(
      screen
        .getByRole('textbox', { name: 'Document editor' })
        .querySelector('[data-type="callout"]'),
    ).toHaveAttribute('data-id', 'callout');

    fireEvent.click(styleControl);

    await waitFor(() => {
      expect(
        onChange.mock.calls.at(-1)?.[0].document.content.content?.[0]?.attrs,
      ).toEqual({ id: 'callout', variant: 'tip' });
    });

    expect(
      screen.getByRole('button', {
        name: 'Callout style: tip. Activate to change',
      }),
    ).toBeInTheDocument();
  });

  it('disables the callout style control when the editor becomes read-only', async () => {
    const { rerender } = render(
      <RicherEditor defaultDocument={makeCalloutDocument('danger')} editable />,
    );
    const styleControl = await screen.findByRole('button', {
      name: 'Callout style: danger. Activate to change',
    });

    expect(styleControl).toBeEnabled();

    rerender(
      <RicherEditor
        defaultDocument={makeCalloutDocument('danger')}
        editable={false}
      />,
    );

    await waitFor(() => expect(styleControl).toBeDisabled());
  });

  it('converts a paragraph to a code block from the toolbar', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();

    function ControlledEditor() {
      const [document, setDocument] = useState(() =>
        createDocument({
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: {
                id: 'block-toolbar-initial-heading',
                level: 2,
                textAlign: null,
              },
              content: [{ type: 'text', text: 'Initial heading' }],
            },
            {
              type: 'paragraph',
              attrs: {
                id: 'block-toolbar-initial-paragraph',
                textAlign: null,
              },
              content: [{ type: 'text', text: 'Initial paragraph' }],
            },
          ],
        }),
      );

      return (
        <>
          <button
            onClick={() => setDocument(makeDocument('', 'block-toolbar-code'))}
            type="button"
          >
            Load paragraph
          </button>
          <RicherEditor
            document={document}
            features={{ toolbar: true }}
            onChange={(change) => {
              onChange(change);
              setDocument(change.document);
            }}
          />
        </>
      );
    }

    render(<ControlledEditor />);

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    fireEvent.click(screen.getByRole('button', { name: 'Load paragraph' }));
    insertTextAtEnd(editor, 'const value = 1');
    await waitFor(() => expect(editor).toHaveTextContent('const value = 1'));

    selectEditorContents(editor);
    fireEvent.click(screen.getByRole('button', { name: 'Bold' }));
    fireEvent.click(screen.getByRole('button', { name: 'Code block' }));

    await waitFor(() =>
      expect(editor.querySelector('pre')).toBeInTheDocument(),
    );

    expect(
      onChange.mock.calls.at(-1)?.[0].document.content.content?.[0],
    ).toEqual({
      type: 'codeBlock',
      attrs: { id: 'block-toolbar-code', language: null },
      content: [{ type: 'text', text: 'const value = 1' }],
    });
    expect(editor.querySelector('pre')).toHaveAttribute(
      'data-id',
      'block-toolbar-code',
    );
  });

  it('disables toolbar controls in read-only mode', () => {
    render(
      <RicherEditor
        defaultDocument={makeDocument('Read only', 'block-toolbar-read-only')}
        editable={false}
        features={{ toolbar: true }}
      />,
    );

    expect(
      screen.getByRole('toolbar', { name: 'Formatting' }),
    ).toBeInTheDocument();

    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled();
    }
  });

  it('applies bold formatting from the selected text menu', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();

    render(
      <RicherEditor
        defaultDocument={makeDocument('Selected text', 'block-bubble-menu')}
        features={{ bubbleMenu: true }}
        onChange={onChange}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    expect(
      screen.queryByRole('toolbar', { name: 'Selection formatting' }),
    ).not.toBeInTheDocument();

    selectText(editor, 0, 8);

    const menu = await screen.findByRole('toolbar', {
      name: 'Selection formatting',
    });

    expect(menu).toBeVisible();
    fireEvent.click(within(menu).getByRole('button', { name: 'Bold' }));

    await waitFor(() => {
      expect(
        onChange.mock.calls.at(-1)?.[0].document.content.content?.[0]
          ?.content?.[0]?.marks,
      ).toEqual([{ type: 'bold' }]);
    });
  });

  it('applies italic formatting from the selected text menu', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();

    render(
      <RicherEditor
        defaultDocument={makeDocument('Selected text', 'block-bubble-italic')}
        features={{ bubbleMenu: true }}
        onChange={onChange}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    selectText(editor, 0, 8);

    const menu = await screen.findByRole('toolbar', {
      name: 'Selection formatting',
    });

    fireEvent.click(within(menu).getByRole('button', { name: 'Italic' }));

    await waitFor(() => {
      expect(
        onChange.mock.calls.at(-1)?.[0].document.content.content?.[0]
          ?.content?.[0]?.marks,
      ).toEqual([{ type: 'italic' }]);
    });
  });

  it('applies underline formatting from the selected text menu', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();

    render(
      <RicherEditor
        defaultDocument={makeDocument(
          'Selected text',
          'block-bubble-underline',
        )}
        features={{ bubbleMenu: true }}
        onChange={onChange}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    selectText(editor, 0, 8);

    const menu = await screen.findByRole('toolbar', {
      name: 'Selection formatting',
    });

    fireEvent.click(within(menu).getByRole('button', { name: 'Underline' }));

    await waitFor(() => {
      expect(
        onChange.mock.calls.at(-1)?.[0].document.content.content?.[0]
          ?.content?.[0]?.marks,
      ).toEqual([{ type: 'underline' }]);
    });
  });

  it('applies inline code formatting from the selected text menu', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();

    render(
      <RicherEditor
        defaultDocument={makeDocument('Selected text', 'block-bubble-code')}
        features={{ bubbleMenu: true }}
        onChange={onChange}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    selectText(editor, 0, 8);

    const menu = await screen.findByRole('toolbar', {
      name: 'Selection formatting',
    });

    fireEvent.click(within(menu).getByRole('button', { name: 'Inline code' }));

    await waitFor(() => {
      expect(
        onChange.mock.calls.at(-1)?.[0].document.content.content?.[0]
          ?.content?.[0]?.marks,
      ).toEqual([{ type: 'code' }]);
    });
  });

  it('hides the selected text menu when the editor loses focus', async () => {
    render(
      <RicherEditor
        defaultDocument={makeDocument('Selected text', 'block-bubble-blur')}
        features={{ bubbleMenu: true }}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    selectText(editor, 0, 8);
    expect(
      await screen.findByRole('toolbar', { name: 'Selection formatting' }),
    ).toBeVisible();

    fireEvent.blur(editor);

    await waitFor(() => {
      expect(
        screen.queryByRole('toolbar', { name: 'Selection formatting' }),
      ).not.toBeInTheDocument();
    });
  });

  it('hides the selected text menu when the editor becomes read-only', async () => {
    const document = makeDocument('Selected text', 'block-bubble-read-only');
    const { rerender } = render(
      <RicherEditor document={document} features={{ bubbleMenu: true }} />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    selectText(editor, 0, 8);
    expect(
      await screen.findByRole('toolbar', { name: 'Selection formatting' }),
    ).toBeVisible();

    rerender(
      <RicherEditor
        document={document}
        editable={false}
        features={{ bubbleMenu: true }}
      />,
    );

    await waitFor(() => {
      expect(
        screen.queryByRole('toolbar', { name: 'Selection formatting' }),
      ).not.toBeInTheDocument();
    });
  });

  it('opens the slash menu when a slash is typed in an empty paragraph', async () => {
    render(
      <RicherEditor
        defaultDocument={makeDocument('', 'slash-paragraph')}
        features={{ slashMenu: true }}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    editor.focus();
    insertTextAtEnd(editor, '/');

    const menu = await screen.findByRole('listbox', { name: 'Insert block' });

    expect(
      within(menu).getByRole('option', { name: 'Text' }),
    ).toBeInTheDocument();
  });

  it('closes the slash menu with Escape without deleting typed text', async () => {
    render(
      <RicherEditor
        defaultDocument={makeDocument('', 'slash-escape-paragraph')}
        features={{ slashMenu: true }}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    editor.focus();
    insertTextAtEnd(editor, '/');
    expect(
      await screen.findByRole('listbox', { name: 'Insert block' }),
    ).toBeInTheDocument();

    fireEvent.keyDown(editor, { key: 'Escape' });

    expect(
      screen.queryByRole('listbox', { name: 'Insert block' }),
    ).not.toBeInTheDocument();
    expect(editor).toHaveTextContent('/');
  });

  it('can reopen the same slash match after the document is reset', async () => {
    function ControlledSlashEditor() {
      const [document, setDocument] = useState(() =>
        makeDocument('', 'slash-reopen-paragraph'),
      );

      return (
        <>
          <button
            onClick={() =>
              setDocument(makeDocument('', 'slash-reopen-paragraph'))
            }
            type="button"
          >
            Reset slash document
          </button>
          <RicherEditor
            document={document}
            features={{ slashMenu: true }}
            onChange={({ document: nextDocument }) => setDocument(nextDocument)}
          />
        </>
      );
    }

    render(<ControlledSlashEditor />);

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    editor.focus();
    insertTextAtEnd(editor, '/');
    expect(
      await screen.findByRole('listbox', { name: 'Insert block' }),
    ).toBeInTheDocument();

    fireEvent.keyDown(editor, { key: 'Escape' });
    fireEvent.click(
      screen.getByRole('button', { name: 'Reset slash document' }),
    );
    await waitFor(() => expect(editor).not.toHaveTextContent('/'));
    editor.focus();
    insertTextAtEnd(editor, '/');
    setCaretOffset(editor, 1);

    expect(
      await screen.findByRole('listbox', { name: 'Insert block' }),
    ).toBeInTheDocument();
  });

  it('filters slash commands by the typed query', async () => {
    render(
      <RicherEditor
        defaultDocument={makeDocument('', 'slash-filter-paragraph')}
        features={{ slashMenu: true }}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    editor.focus();
    insertTextAtEnd(editor, '/call');

    const menu = await screen.findByRole('listbox', { name: 'Insert block' });

    expect(
      within(menu).getByRole('option', { name: 'Callout' }),
    ).toBeInTheDocument();
    expect(
      within(menu).queryByRole('option', { name: 'Text' }),
    ).not.toBeInTheDocument();
  });

  it('inserts a callout from a filtered slash command', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();

    render(
      <RicherEditor
        defaultDocument={makeDocument('', 'slash-callout-paragraph')}
        features={{ slashMenu: true }}
        onChange={onChange}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    editor.focus();
    insertTextAtEnd(editor, '/call');

    const menu = await screen.findByRole('listbox', { name: 'Insert block' });

    fireEvent.click(within(menu).getByRole('option', { name: 'Callout' }));

    await waitFor(() => {
      expect(
        onChange.mock.calls.at(-1)?.[0].document.content.content?.[0],
      ).toMatchObject({
        type: 'callout',
        attrs: { id: expect.any(String), variant: 'info' },
        content: [
          {
            type: 'paragraph',
            attrs: { id: 'slash-callout-paragraph', textAlign: null },
          },
        ],
      });
    });
    expect(editor).not.toHaveTextContent('/call');
  });

  it('runs the filtered slash command with Enter', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();

    render(
      <RicherEditor
        defaultDocument={makeDocument('', 'slash-enter-paragraph')}
        features={{ slashMenu: true }}
        onChange={onChange}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    editor.focus();
    insertTextAtEnd(editor, '/call');
    expect(
      await screen.findByRole('option', { name: 'Callout' }),
    ).toBeInTheDocument();

    fireEvent.keyDown(editor, { key: 'Enter' });

    await waitFor(() => {
      expect(
        onChange.mock.calls.at(-1)?.[0].document.content.content?.[0]?.type,
      ).toBe('callout');
    });
  });

  it('moves through slash commands with arrow keys before pressing Enter', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();

    render(
      <RicherEditor
        defaultDocument={makeDocument('', 'slash-arrow-paragraph')}
        features={{ slashMenu: true }}
        onChange={onChange}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    editor.focus();
    insertTextAtEnd(editor, '/heading');

    const heading1Option = await screen.findByRole('option', {
      name: 'Heading 1',
    });
    const heading2Option = screen.getByRole('option', { name: 'Heading 2' });

    expect(heading1Option).toHaveAttribute('aria-selected', 'true');
    expect(heading2Option).toHaveAttribute('aria-selected', 'false');

    fireEvent.keyDown(editor, { key: 'ArrowDown' });

    expect(heading1Option).toHaveAttribute('aria-selected', 'false');
    expect(heading2Option).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(editor, { key: 'Enter' });

    await waitFor(() => {
      expect(
        onChange.mock.calls.at(-1)?.[0].document.content.content?.[0],
      ).toMatchObject({
        type: 'heading',
        attrs: {
          id: 'slash-arrow-paragraph',
          level: 2,
          textAlign: null,
        },
      });
    });
  });

  it('exposes the selected slash command from the focused editor', async () => {
    render(
      <RicherEditor
        defaultDocument={makeDocument('', 'slash-active-paragraph')}
        features={{ slashMenu: true }}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    editor.focus();
    insertTextAtEnd(editor, '/heading');

    const menu = await screen.findByRole('listbox', { name: 'Insert block' });
    const heading1Option = within(menu).getByRole('option', {
      name: 'Heading 1',
    });
    const heading2Option = within(menu).getByRole('option', {
      name: 'Heading 2',
    });

    expect(menu.id).not.toBe('');
    expect(heading1Option.id).not.toBe('');
    expect(editor).toHaveAttribute('aria-controls', menu.id);
    expect(editor).toHaveAttribute('aria-activedescendant', heading1Option.id);

    fireEvent.keyDown(editor, { key: 'ArrowDown' });

    expect(editor).toHaveAttribute('aria-activedescendant', heading2Option.id);
  });

  it('wraps from the first to the last slash command with ArrowUp', async () => {
    render(
      <RicherEditor
        defaultDocument={makeDocument('', 'slash-arrow-up-paragraph')}
        features={{ slashMenu: true }}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    editor.focus();
    insertTextAtEnd(editor, '/');

    const textOption = await screen.findByRole('option', { name: 'Text' });
    const dividerOption = screen.getByRole('option', { name: 'Divider' });

    expect(textOption).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(editor, { key: 'ArrowUp' });

    expect(textOption).toHaveAttribute('aria-selected', 'false');
    expect(dividerOption).toHaveAttribute('aria-selected', 'true');
  });

  it('lists the supported block commands in a stable order', async () => {
    render(
      <RicherEditor
        defaultDocument={makeDocument('', 'slash-commands-paragraph')}
        features={{ slashMenu: true }}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    editor.focus();
    insertTextAtEnd(editor, '/');

    const menu = await screen.findByRole('listbox', { name: 'Insert block' });

    expect(
      within(menu)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual([
      'Text',
      'Heading 1',
      'Heading 2',
      'Heading 3',
      'Bullet list',
      'Ordered list',
      'Task list',
      'Table',
      'Quote',
      'Code block',
      'Callout',
      'Toggle',
      'Divider',
    ]);
  });

  it('shows an explicit empty state when no slash commands match', async () => {
    render(
      <RicherEditor
        defaultDocument={makeDocument('', 'slash-empty-paragraph')}
        features={{ slashMenu: true }}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    editor.focus();
    insertTextAtEnd(editor, '/not-a-command');

    const menu = await screen.findByRole('listbox', { name: 'Insert block' });

    expect(
      within(menu).getByRole('status', { name: 'No commands found' }),
    ).toBeInTheDocument();
    expect(within(menu).queryAllByRole('option')).toHaveLength(0);
  });

  it('closes the slash menu when the editor loses focus', async () => {
    render(
      <RicherEditor
        defaultDocument={makeDocument('', 'slash-blur-paragraph')}
        features={{ slashMenu: true }}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    editor.focus();
    insertTextAtEnd(editor, '/');
    expect(
      await screen.findByRole('listbox', { name: 'Insert block' }),
    ).toBeInTheDocument();

    fireEvent.blur(editor);

    await waitFor(() => {
      expect(
        screen.queryByRole('listbox', { name: 'Insert block' }),
      ).not.toBeInTheDocument();
    });
  });

  it('does not open the slash menu during text composition', () => {
    render(
      <RicherEditor
        defaultDocument={makeDocument('', 'slash-composition-paragraph')}
        features={{ slashMenu: true }}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    editor.focus();
    fireEvent.compositionStart(editor);
    insertTextAtEnd(editor, '/');

    expect(
      screen.queryByRole('listbox', { name: 'Insert block' }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ['Text', '/text', 'paragraph'],
    ['Bullet list', '/bullet', 'bulletList'],
    ['Ordered list', '/ordered', 'orderedList'],
    ['Task list', '/task', 'taskList'],
    ['Table', '/table', 'table'],
    ['Quote', '/quote', 'blockquote'],
    ['Code block', '/code', 'codeBlock'],
    ['Toggle', '/toggle', 'details'],
    ['Divider', '/divider', 'horizontalRule'],
  ] as const)(
    'runs the %s slash command',
    async (label, query, expectedType) => {
      const onChange = vi.fn<(change: TestEditorChange) => void>();

      render(
        <RicherEditor
          defaultDocument={makeDocument('', `slash-${expectedType}`)}
          features={{ slashMenu: true }}
          onChange={onChange}
        />,
      );

      const editor = screen.getByRole('textbox', { name: 'Document editor' });

      editor.focus();
      insertTextAtEnd(editor, query);

      const option = await screen.findByRole('option', { name: label });

      fireEvent.click(option);

      await waitFor(() => {
        expect(
          onChange.mock.calls.at(-1)?.[0].document.content.content?.[0]?.type,
        ).toBe(expectedType);
      });
      expect(editor).not.toHaveTextContent(query);
    },
  );

  it('closes the slash menu when the editor becomes read-only', async () => {
    const initialDocument = makeDocument('', 'slash-read-only-paragraph');
    const { rerender } = render(
      <RicherEditor
        defaultDocument={initialDocument}
        features={{ slashMenu: true }}
      />,
    );
    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    editor.focus();
    insertTextAtEnd(editor, '/');
    expect(
      await screen.findByRole('listbox', { name: 'Insert block' }),
    ).toBeInTheDocument();

    rerender(
      <RicherEditor
        defaultDocument={initialDocument}
        editable={false}
        features={{ slashMenu: true }}
      />,
    );

    expect(
      screen.queryByRole('listbox', { name: 'Insert block' }),
    ).not.toBeInTheDocument();
  });

  it('does not open the slash menu for a slash inside a word', () => {
    render(
      <RicherEditor
        defaultDocument={makeDocument('word', 'slash-word-paragraph')}
        features={{ slashMenu: true }}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    setCaretOffset(editor, 4);
    insertTextAtEnd(editor, '/call');

    expect(
      screen.queryByRole('listbox', { name: 'Insert block' }),
    ).not.toBeInTheDocument();
  });

  it('opens search with the platform shortcut and reports matching text', async () => {
    render(
      <RicherEditor
        defaultDocument={makeDocument(
          'Find this text, then find it again.',
          'search-paragraph',
        )}
        features={{ search: true }}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    editor.focus();
    fireEvent.keyDown(editor, { key: 'f', metaKey: true });

    const search = await screen.findByRole('search', {
      name: 'Find and replace',
    });
    const findInput = within(search).getByRole('searchbox', { name: 'Find' });

    expect(findInput).toHaveFocus();

    fireEvent.change(findInput, { target: { value: 'find' } });

    expect(
      await within(search).findByRole('status', { name: 'Search matches' }),
    ).toHaveTextContent('1/2');
    expect(
      editor.querySelectorAll('.richer-editor__search-match'),
    ).toHaveLength(2);
    expect(
      editor.querySelectorAll('.richer-editor__search-match--active'),
    ).toHaveLength(1);

    fireEvent.click(
      within(search).getByRole('button', { name: 'Close search' }),
    );

    expect(
      screen.queryByRole('search', { name: 'Find and replace' }),
    ).not.toBeInTheDocument();
    expect(editor).toHaveFocus();
    expect(
      editor.querySelectorAll('.richer-editor__search-match'),
    ).toHaveLength(0);
  });

  it('moves between search matches in both directions and wraps around', async () => {
    render(
      <RicherEditor
        defaultDocument={makeDocument(
          'Find the first result, then find the second.',
          'search-navigation-paragraph',
        )}
        features={{ search: true }}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    editor.focus();
    fireEvent.keyDown(editor, { ctrlKey: true, key: 'f' });

    const search = await screen.findByRole('search', {
      name: 'Find and replace',
    });

    fireEvent.change(within(search).getByRole('searchbox', { name: 'Find' }), {
      target: { value: 'find' },
    });

    const status = within(search).getByRole('status', {
      name: 'Search matches',
    });
    const activeMatch = () =>
      editor.querySelector('.richer-editor__search-match--active');

    expect(status).toHaveTextContent('1/2');
    expect(activeMatch()).toHaveTextContent('Find');

    fireEvent.click(within(search).getByRole('button', { name: 'Next match' }));

    expect(status).toHaveTextContent('2/2');
    expect(activeMatch()).toHaveTextContent('find');

    fireEvent.click(within(search).getByRole('button', { name: 'Next match' }));

    expect(status).toHaveTextContent('1/2');
    expect(activeMatch()).toHaveTextContent('Find');

    fireEvent.click(
      within(search).getByRole('button', { name: 'Previous match' }),
    );

    expect(status).toHaveTextContent('2/2');
    expect(activeMatch()).toHaveTextContent('find');
  });

  it('navigates search matches with Enter and Shift+Enter', async () => {
    render(
      <RicherEditor
        defaultDocument={makeDocument(
          'Find with Enter, then find with Shift+Enter.',
          'search-keyboard-paragraph',
        )}
        features={{ search: true }}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    editor.focus();
    fireEvent.keyDown(editor, { key: 'f', metaKey: true });

    const search = await screen.findByRole('search', {
      name: 'Find and replace',
    });
    const findInput = within(search).getByRole('searchbox', { name: 'Find' });
    const status = within(search).getByRole('status', {
      name: 'Search matches',
    });

    fireEvent.change(findInput, { target: { value: 'find' } });
    fireEvent.keyDown(findInput, { key: 'Enter' });

    expect(status).toHaveTextContent('2/2');

    fireEvent.keyDown(findInput, { key: 'Enter', shiftKey: true });

    expect(status).toHaveTextContent('1/2');
    expect(findInput).toHaveFocus();
  });

  it('replaces the current search match through the document change callback', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();

    render(
      <RicherEditor
        defaultDocument={makeDocument(
          'Find the first result, then find the second.',
          'search-replace-paragraph',
        )}
        features={{ search: true }}
        onChange={onChange}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    editor.focus();
    fireEvent.keyDown(editor, { key: 'f', metaKey: true });

    const search = await screen.findByRole('search', {
      name: 'Find and replace',
    });

    fireEvent.change(within(search).getByRole('searchbox', { name: 'Find' }), {
      target: { value: 'find' },
    });
    fireEvent.change(within(search).getByRole('textbox', { name: 'Replace' }), {
      target: { value: 'Locate' },
    });
    const replaceCurrent = within(search).getByRole('button', {
      name: 'Replace current',
    });

    expect(fireEvent.keyDown(replaceCurrent, { key: 'Enter' })).toBe(true);
    fireEvent.click(replaceCurrent);

    await waitFor(() => {
      expect(
        onChange.mock.calls.at(-1)?.[0].document.content.content?.[0]?.content,
      ).toEqual([
        {
          type: 'text',
          text: 'Locate the first result, then find the second.',
        },
      ]);
    });
    expect(editor).toHaveTextContent(
      'Locate the first result, then find the second.',
    );
    expect(
      within(search).getByRole('status', { name: 'Search matches' }),
    ).toHaveTextContent('1/1');
  });

  it('replaces every search match in one document update', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();

    render(
      <RicherEditor
        defaultDocument={makeDocument(
          'Find the first result, then find the second.',
          'search-replace-all-paragraph',
        )}
        features={{ search: true }}
        onChange={onChange}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    editor.focus();
    fireEvent.keyDown(editor, { ctrlKey: true, key: 'f' });

    const search = await screen.findByRole('search', {
      name: 'Find and replace',
    });

    fireEvent.change(within(search).getByRole('searchbox', { name: 'Find' }), {
      target: { value: 'find' },
    });
    fireEvent.change(within(search).getByRole('textbox', { name: 'Replace' }), {
      target: { value: 'Locate' },
    });
    fireEvent.click(
      within(search).getByRole('button', { name: 'Replace all' }),
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(
        onChange.mock.calls[0]?.[0].document.content.content?.[0]?.content,
      ).toEqual([
        {
          type: 'text',
          text: 'Locate the first result, then Locate the second.',
        },
      ]);
    });
    expect(editor).toHaveTextContent(
      'Locate the first result, then Locate the second.',
    );
    expect(
      within(search).getByRole('status', { name: 'Search matches' }),
    ).toHaveTextContent('No matches');
  });

  it('stays closed after the search feature is disabled and re-enabled', async () => {
    const initialDocument = makeDocument(
      'Find this text.',
      'search-feature-paragraph',
    );
    const { rerender } = render(
      <RicherEditor
        defaultDocument={initialDocument}
        features={{ search: true }}
      />,
    );
    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    editor.focus();
    fireEvent.keyDown(editor, { key: 'f', metaKey: true });

    const search = await screen.findByRole('search', {
      name: 'Find and replace',
    });

    fireEvent.change(within(search).getByRole('searchbox', { name: 'Find' }), {
      target: { value: 'find' },
    });
    expect(
      editor.querySelectorAll('.richer-editor__search-match'),
    ).toHaveLength(1);

    rerender(<RicherEditor defaultDocument={initialDocument} features={{}} />);

    expect(
      screen.queryByRole('search', { name: 'Find and replace' }),
    ).not.toBeInTheDocument();
    expect(
      editor.querySelectorAll('.richer-editor__search-match'),
    ).toHaveLength(0);

    rerender(
      <RicherEditor
        defaultDocument={initialDocument}
        features={{ search: true }}
      />,
    );

    expect(
      screen.queryByRole('search', { name: 'Find and replace' }),
    ).not.toBeInTheDocument();
  });

  it('disables search actions for empty queries and missing results', async () => {
    render(
      <RicherEditor
        defaultDocument={makeDocument(
          'Find this text.',
          'search-empty-query-paragraph',
        )}
        features={{ search: true }}
      />,
    );
    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    editor.focus();
    fireEvent.keyDown(editor, { key: 'f', metaKey: true });

    const search = await screen.findByRole('search', {
      name: 'Find and replace',
    });
    const findInput = within(search).getByRole('searchbox', { name: 'Find' });
    const status = within(search).getByRole('status', {
      name: 'Search matches',
    });
    const actions = [
      within(search).getByRole('button', { name: 'Previous match' }),
      within(search).getByRole('button', { name: 'Next match' }),
      within(search).getByRole('button', { name: 'Replace current' }),
      within(search).getByRole('button', { name: 'Replace all' }),
    ];

    expect(status).toHaveTextContent('0/0');
    actions.forEach((action) => expect(action).toBeDisabled());

    fireEvent.change(findInput, { target: { value: 'missing' } });

    expect(status).toHaveTextContent('No matches');
    actions.forEach((action) => expect(action).toBeDisabled());
    expect(
      editor.querySelectorAll('.richer-editor__search-match'),
    ).toHaveLength(0);

    fireEvent.change(findInput, { target: { value: 'find' } });
    expect(status).toHaveTextContent('1/1');

    fireEvent.change(findInput, { target: { value: '' } });

    expect(status).toHaveTextContent('0/0');
    actions.forEach((action) => expect(action).toBeDisabled());
    expect(
      editor.querySelectorAll('.richer-editor__search-match'),
    ).toHaveLength(0);
  });

  it('allows searching but disables replacement in read-only mode', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();

    render(
      <RicherEditor
        defaultDocument={makeDocument(
          'Find read-only content.',
          'search-read-only-paragraph',
        )}
        editable={false}
        features={{ search: true }}
        onChange={onChange}
      />,
    );
    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    editor.focus();
    fireEvent.keyDown(editor, { ctrlKey: true, key: 'f' });

    const search = await screen.findByRole('search', {
      name: 'Find and replace',
    });
    const findInput = within(search).getByRole('searchbox', { name: 'Find' });
    const replaceInput = within(search).getByRole('textbox', {
      name: 'Replace',
    });
    const previous = within(search).getByRole('button', {
      name: 'Previous match',
    });
    const next = within(search).getByRole('button', { name: 'Next match' });
    const replaceCurrent = within(search).getByRole('button', {
      name: 'Replace current',
    });
    const replaceAll = within(search).getByRole('button', {
      name: 'Replace all',
    });

    fireEvent.change(findInput, { target: { value: 'find' } });

    expect(
      within(search).getByRole('status', { name: 'Search matches' }),
    ).toHaveTextContent('1/1');
    expect(previous).toBeEnabled();
    expect(next).toBeEnabled();
    expect(replaceInput).toBeDisabled();
    expect(replaceCurrent).toBeDisabled();
    expect(replaceAll).toBeDisabled();

    fireEvent.click(replaceCurrent);
    fireEvent.click(replaceAll);

    expect(onChange).not.toHaveBeenCalled();
    expect(editor).toHaveTextContent('Find read-only content.');
  });

  it('recalculates search matches after a controlled document update', async () => {
    function ControlledSearchEditor() {
      const [document, setDocument] = useState(() =>
        makeDocument('Find this once.', 'search-controlled-paragraph'),
      );

      return (
        <>
          <button
            onClick={() =>
              setDocument(
                makeDocument(
                  'Find this twice, then find it again.',
                  'search-controlled-paragraph',
                ),
              )
            }
            type="button"
          >
            Update search document
          </button>
          <RicherEditor document={document} features={{ search: true }} />
        </>
      );
    }

    render(<ControlledSearchEditor />);

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    editor.focus();
    fireEvent.keyDown(editor, { key: 'f', metaKey: true });

    const search = await screen.findByRole('search', {
      name: 'Find and replace',
    });

    fireEvent.change(within(search).getByRole('searchbox', { name: 'Find' }), {
      target: { value: 'find' },
    });
    expect(
      within(search).getByRole('status', { name: 'Search matches' }),
    ).toHaveTextContent('1/1');

    fireEvent.click(
      screen.getByRole('button', { name: 'Update search document' }),
    );

    await waitFor(() => {
      expect(editor).toHaveTextContent('Find this twice, then find it again.');
      expect(
        within(search).getByRole('status', { name: 'Search matches' }),
      ).toHaveTextContent('1/2');
    });
  });

  it('shows a custom placeholder in an empty editable document', () => {
    render(<RicherEditor placeholder="Start a document" />);

    const editor = screen.getByRole('textbox', { name: 'Document editor' });
    const emptyParagraph = editor.querySelector('p');

    expect(emptyParagraph).toHaveClass('is-editor-empty');
    expect(emptyParagraph).toHaveAttribute(
      'data-placeholder',
      'Start a document',
    );
  });

  it('updates the placeholder without rebuilding the editor', () => {
    const { rerender } = render(<RicherEditor placeholder="First prompt" />);
    const editor = screen.getByRole('textbox', { name: 'Document editor' });
    const emptyParagraph = editor.querySelector('p');

    rerender(<RicherEditor placeholder="Second prompt" />);

    expect(emptyParagraph).toHaveAttribute('data-placeholder', 'Second prompt');
  });

  it('does not show a placeholder in a non-empty document', () => {
    render(
      <RicherEditor
        defaultDocument={makeDocument('Existing content', 'block-existing')}
        placeholder="Start a document"
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });
    const paragraph = editor.querySelector('p');

    expect(paragraph).not.toHaveClass('is-editor-empty');
    expect(paragraph).not.toHaveAttribute('data-placeholder');
  });

  it('does not show a placeholder in a read-only empty document', () => {
    render(
      <RicherEditor
        defaultDocument={makeDocument('', 'block-read-only')}
        editable={false}
        placeholder="Start a document"
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });
    const paragraph = editor.querySelector('p');

    expect(editor).toHaveAttribute('aria-readonly', 'true');
    expect(paragraph).not.toHaveClass('is-editor-empty');
    expect(paragraph).not.toHaveAttribute('data-placeholder');
  });

  it('reports character and word counts for the initial document', async () => {
    const onCharacterCountChange =
      vi.fn<(count: { characters: number; words: number }) => void>();

    render(
      <RicherEditor
        defaultDocument={makeDocument('Hello world', 'block-count')}
        onCharacterCountChange={onCharacterCountChange}
      />,
    );

    await waitFor(() => {
      expect(onCharacterCountChange).toHaveBeenLastCalledWith({
        characters: 11,
        words: 2,
      });
    });
  });

  it('reports updated counts after a local edit', async () => {
    const onCharacterCountChange =
      vi.fn<(count: { characters: number; words: number }) => void>();

    render(
      <RicherEditor
        defaultDocument={makeDocument('Hello', 'block-local-count')}
        onCharacterCountChange={onCharacterCountChange}
      />,
    );

    await waitFor(() => expect(onCharacterCountChange).toHaveBeenCalled());
    onCharacterCountChange.mockClear();

    insertTextAtEnd(
      screen.getByRole('textbox', { name: 'Document editor' }),
      ' world',
    );

    await waitFor(() => {
      expect(onCharacterCountChange).toHaveBeenLastCalledWith({
        characters: 11,
        words: 2,
      });
    });
  });

  it('reports updated counts after an external document change', async () => {
    const onCharacterCountChange =
      vi.fn<(count: { characters: number; words: number }) => void>();
    const { rerender } = render(
      <RicherEditor
        document={makeDocument('First', 'block-first-count')}
        onCharacterCountChange={onCharacterCountChange}
      />,
    );

    await waitFor(() => expect(onCharacterCountChange).toHaveBeenCalled());
    onCharacterCountChange.mockClear();

    rerender(
      <RicherEditor
        document={makeDocument('Second value', 'block-second-count')}
        onCharacterCountChange={onCharacterCountChange}
      />,
    );

    await waitFor(() => {
      expect(onCharacterCountChange).toHaveBeenLastCalledWith({
        characters: 12,
        words: 2,
      });
    });
  });

  it('highlights a code block using its declared language', () => {
    render(<RicherEditor defaultDocument={makeCodeDocument()} />);

    const editor = screen.getByRole('textbox', { name: 'Document editor' });
    const code = editor.querySelector('code');

    expect(code).toHaveClass('language-javascript');
    expect(code?.querySelector('.hljs-keyword')).toHaveTextContent('const');
    expect(code?.querySelector('.hljs-number')).toHaveTextContent('42');
  });

  it('preserves unknown code block languages and text', () => {
    render(
      <RicherEditor
        defaultDocument={makeCodeDocument(
          'unknown-language',
          'unclassified plain value',
        )}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });
    const code = editor.querySelector('code');

    expect(code).toHaveClass('language-unknown-language');
    expect(code).toHaveTextContent('unclassified plain value');
  });

  it('gives a details toggle an accessible name from its summary', () => {
    render(<RicherEditor defaultDocument={makeDetailsDocument()} />);

    const toggle = screen.getByRole('button', {
      name: 'Expand details: More information',
    });

    fireEvent.click(toggle);

    expect(toggle).toHaveAccessibleName('Collapse details: More information');
  });

  it('edits a default document in uncontrolled mode', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();

    render(
      <RicherEditor
        defaultDocument={makeDocument('Draft', 'block-draft')}
        onChange={onChange}
      />,
    );

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    expect(editor).toHaveTextContent('Draft');

    insertTextAtEnd(editor, '!');

    await waitFor(() => {
      expect(editor).toHaveTextContent('Draft!');
      expect(onChange).toHaveBeenCalled();
    });

    expect(onChange.mock.calls.at(-1)?.[0].document.content).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { id: 'block-draft', textAlign: null },
          content: [{ type: 'text', text: 'Draft!' }],
        },
      ],
    });
  });

  it('keeps controlled input stable while the host writes changes back', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();

    function ControlledEditor() {
      const [document, setDocument] = useState(() =>
        makeDocument('Controlled', 'block-controlled'),
      );

      return (
        <RicherEditor
          document={document}
          onChange={(change: TestEditorChange) => {
            onChange(change);
            setDocument(change.document);
          }}
        />
      );
    }

    render(<ControlledEditor />);

    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    insertTextAtEnd(editor, '!');

    await waitFor(() => expect(editor).toHaveTextContent('Controlled!'));

    insertTextAtEnd(editor, '?');

    await waitFor(() => expect(editor).toHaveTextContent('Controlled!?'));
    expect(
      onChange.mock.calls.map(
        ([change]) => change.document.content.content?.[0]?.content?.[0]?.text,
      ),
    ).toEqual(['Controlled!', 'Controlled!?']);
  });

  it('undoes a local edit', async () => {
    render(
      <RicherEditor defaultDocument={makeDocument('Undo', 'block-undo')} />,
    );
    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    insertTextAtEnd(editor, '!');
    await waitFor(() => expect(editor).toHaveTextContent('Undo!'));

    fireEvent.keyDown(editor, {
      code: 'KeyZ',
      ctrlKey: true,
      key: 'z',
    });

    await waitFor(() => expect(editor).toHaveTextContent('Undo'));
  });

  it('applies an external update without emitting, moving the caret, or adding history', async () => {
    const onChange = vi.fn<(change: TestEditorChange) => void>();
    const { rerender } = render(
      <RicherEditor
        document={makeDocument('First', 'block-first')}
        onChange={onChange}
      />,
    );
    const editor = screen.getByRole('textbox', { name: 'Document editor' });

    expect(editor).toHaveTextContent('First');
    setCaretOffset(editor, 3);
    onChange.mockClear();

    rerender(
      <RicherEditor
        document={makeDocument('Second', 'block-second')}
        onChange={onChange}
      />,
    );

    await waitFor(() => expect(editor).toHaveTextContent('Second'));
    expect(window.getSelection()?.anchorOffset).toBe(3);
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.keyDown(editor, {
      code: 'KeyZ',
      ctrlKey: true,
      key: 'z',
    });

    expect(editor).toHaveTextContent('Second');
  });

  it('rejects switching between controlled and uncontrolled modes', () => {
    const controlledDocument = makeDocument('Controlled', 'block-controlled');
    const defaultDocument = makeDocument('Default', 'block-default');

    function ModeHarness({ controlled }: { controlled: boolean }) {
      return controlled ? (
        <RicherEditor document={controlledDocument} />
      ) : (
        <RicherEditor defaultDocument={defaultDocument} />
      );
    }

    const { rerender } = render(<ModeHarness controlled />);

    expect(() => rerender(<ModeHarness controlled={false} />)).toThrow(
      'RicherEditor cannot switch between controlled and uncontrolled modes.',
    );
  });
});
