import { EditorContent, useEditor } from '@tiptap/react';
import { Selection } from '@tiptap/pm/state';
import { useEffect, useRef, type HTMLAttributes } from 'react';

import {
  createDocument,
  extractContent,
  type RicherDocument,
} from './document';
import { richerSchemaRegistry } from './schema';

export interface RicherEditorChange {
  document: RicherDocument;
}

interface RicherEditorSharedProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'defaultValue' | 'onChange'
> {
  'aria-label'?: string;
  editable?: boolean;
  onChange?: (change: RicherEditorChange) => void;
}

interface RicherEditorControlledProps extends RicherEditorSharedProps {
  document: RicherDocument;
  defaultDocument?: never;
}

interface RicherEditorUncontrolledProps extends RicherEditorSharedProps {
  document?: never;
  defaultDocument?: RicherDocument;
}

export type RicherEditorProps =
  RicherEditorControlledProps | RicherEditorUncontrolledProps;

function createEmptyEditorDocument(): RicherDocument {
  return createDocument({
    type: 'doc',
    content: [{ type: 'paragraph' }],
  });
}

export function RicherEditor({
  'aria-label': ariaLabel = 'Document editor',
  className,
  defaultDocument,
  document,
  editable = true,
  onChange,
  ...props
}: RicherEditorProps) {
  const isControlled = document !== undefined;
  const initialModeRef = useRef(isControlled);

  if (initialModeRef.current !== isControlled) {
    throw new Error(
      'RicherEditor cannot switch between controlled and uncontrolled modes.',
    );
  }

  const initialDocumentRef = useRef(
    document ?? defaultDocument ?? createEmptyEditorDocument(),
  );
  const currentDocumentRef = useRef(initialDocumentRef.current);
  const onChangeRef = useRef(onChange);

  onChangeRef.current = onChange;

  if (document) {
    currentDocumentRef.current = document;
  }

  const editor = useEditor(
    {
      content: extractContent(initialDocumentRef.current),
      editable,
      editorProps: {
        attributes: {
          'aria-label': ariaLabel,
          'aria-readonly': String(!editable),
          class: 'richer-editor__content',
          role: 'textbox',
        },
      },
      extensions: richerSchemaRegistry.extensions,
      onUpdate: ({ editor: updatedEditor }) => {
        const nextDocument: RicherDocument = {
          ...currentDocumentRef.current,
          content: updatedEditor.getJSON(),
        };

        if (!initialModeRef.current) {
          currentDocumentRef.current = nextDocument;
        }

        onChangeRef.current?.({ document: nextDocument });
      },
    },
    [],
  );

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(editable, false);
    editor.setOptions({
      editorProps: {
        attributes: {
          'aria-label': ariaLabel,
          'aria-readonly': String(!editable),
          class: 'richer-editor__content',
          role: 'textbox',
        },
      },
    });
  }, [ariaLabel, editable, editor]);

  useEffect(() => {
    if (!editor || !document) {
      return;
    }

    const nextDocument = editor.schema.nodeFromJSON(extractContent(document));

    if (editor.state.doc.eq(nextDocument)) {
      return;
    }

    const selectionPosition = Math.min(
      editor.state.selection.head,
      nextDocument.content.size,
    );
    const transaction = editor.state.tr.replaceWith(
      0,
      editor.state.doc.content.size,
      nextDocument.content,
    );
    const nextSelection = Selection.near(
      transaction.doc.resolve(selectionPosition),
    );

    transaction.setSelection(nextSelection);
    transaction.setMeta('addToHistory', false);
    transaction.setMeta('preventUpdate', true);
    editor.view.dispatch(transaction);
  }, [document, editor]);

  const rootClassName = ['richer-editor', className].filter(Boolean).join(' ');

  return <EditorContent {...props} className={rootClassName} editor={editor} />;
}
