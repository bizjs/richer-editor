import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

describe('RicherEditor public component', () => {
  it('renders an accessible editor surface', () => {
    render(<RicherEditor />);

    expect(
      screen.getByRole('textbox', { name: 'Document editor' }),
    ).toBeInTheDocument();
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
