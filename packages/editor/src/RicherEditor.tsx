import type { Editor } from '@tiptap/core';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { BubbleMenu, type BubbleMenuProps } from '@tiptap/react/menus';
import { Placeholder } from '@tiptap/extensions/placeholder';
import { Selection } from '@tiptap/pm/state';
import { useEffect, useRef, type HTMLAttributes } from 'react';

import {
  createDocument,
  extractContent,
  type RicherDocument,
} from './document';
import { RicherEditorEditableContext } from './editor-context';
import { richerSchemaRegistry } from './schema';

export interface RicherEditorChange {
  document: RicherDocument;
}

export interface RicherEditorCharacterCount {
  characters: number;
  words: number;
}

export interface RicherEditorFeatures {
  bubbleMenu?: boolean;
  toolbar?: boolean;
}

interface RicherEditorSharedProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'defaultValue' | 'onChange'
> {
  'aria-label'?: string;
  editable?: boolean;
  features?: RicherEditorFeatures;
  onCharacterCountChange?: (count: RicherEditorCharacterCount) => void;
  onChange?: (change: RicherEditorChange) => void;
  placeholder?: string;
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

function getCharacterCount(editor: Editor): RicherEditorCharacterCount {
  return {
    characters: editor.storage.characterCount.characters(),
    words: editor.storage.characterCount.words(),
  };
}

function createEmptyEditorDocument(): RicherDocument {
  return createDocument({
    type: 'doc',
    content: [{ type: 'paragraph' }],
  });
}

function getSingleSelectedBlockId(editor: Editor): string | null {
  const ids = new Set<string>();
  const { from, to } = editor.state.selection;

  editor.state.doc.nodesBetween(from, to, (node) => {
    if (node.isTextblock && typeof node.attrs.id === 'string') {
      ids.add(node.attrs.id);
    }
  });

  return ids.size === 1 ? ([...ids][0] ?? null) : null;
}

function toggleCodeBlock(editor: Editor): void {
  const blockId = getSingleSelectedBlockId(editor);
  const targetType = editor.isActive('codeBlock') ? 'paragraph' : 'codeBlock';
  const chain = editor.chain().focus().toggleCodeBlock();

  if (blockId) {
    chain.updateAttributes(targetType, { id: blockId });
  }

  chain.run();
}

function toggleHeading2(editor: Editor): void {
  const blockId = getSingleSelectedBlockId(editor);
  const targetType = editor.isActive('heading', { level: 2 })
    ? 'paragraph'
    : 'heading';
  const chain = editor.chain().focus().toggleHeading({ level: 2 });

  if (blockId) {
    chain.updateAttributes(targetType, { id: blockId });
  }

  chain.run();
}

const shouldShowSelectionMenu: NonNullable<BubbleMenuProps['shouldShow']> = ({
  editor,
  from,
  to,
}) => editor.isEditable && from !== to;

function RicherBubbleMenu({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      canToggleBold: currentEditor.can().toggleBold(),
      canToggleCode: currentEditor.can().toggleCode(),
      canToggleItalic: currentEditor.can().toggleItalic(),
      canToggleUnderline: currentEditor.can().toggleUnderline(),
      isBold: currentEditor.isActive('bold'),
      isCode: currentEditor.isActive('code'),
      isItalic: currentEditor.isActive('italic'),
      isUnderline: currentEditor.isActive('underline'),
    }),
  });

  return (
    <BubbleMenu
      editor={editor}
      resizeDelay={0}
      shouldShow={shouldShowSelectionMenu}
      updateDelay={0}
    >
      <div
        aria-label="Selection formatting"
        className="richer-editor__bubble-menu"
        role="toolbar"
      >
        <button
          aria-label="Bold"
          aria-pressed={state.isBold}
          disabled={!state.canToggleBold}
          onClick={() => editor.chain().focus().toggleBold().run()}
          onMouseDown={(event) => event.preventDefault()}
          type="button"
        >
          Bold
        </button>
        <button
          aria-label="Italic"
          aria-pressed={state.isItalic}
          disabled={!state.canToggleItalic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          onMouseDown={(event) => event.preventDefault()}
          type="button"
        >
          Italic
        </button>
        <button
          aria-label="Underline"
          aria-pressed={state.isUnderline}
          disabled={!state.canToggleUnderline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          onMouseDown={(event) => event.preventDefault()}
          type="button"
        >
          Underline
        </button>
        <button
          aria-label="Inline code"
          aria-pressed={state.isCode}
          disabled={!state.canToggleCode}
          onClick={() => editor.chain().focus().toggleCode().run()}
          onMouseDown={(event) => event.preventDefault()}
          type="button"
        >
          Inline code
        </button>
      </div>
    </BubbleMenu>
  );
}

function RicherToolbar({
  editable,
  editor,
}: {
  editable: boolean;
  editor: Editor | null;
}) {
  const state = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      canClearFormatting: currentEditor?.can().unsetAllMarks() ?? false,
      canToggleBlockquote: currentEditor?.can().toggleBlockquote() ?? false,
      canToggleBulletList: currentEditor?.can().toggleBulletList() ?? false,
      canToggleCallout: currentEditor?.can().toggleCallout() ?? false,
      canToggleBold: currentEditor?.can().toggleBold() ?? false,
      canToggleCode: currentEditor?.can().toggleCode() ?? false,
      canToggleCodeBlock: currentEditor?.can().toggleCodeBlock() ?? false,
      canToggleHeading2:
        currentEditor?.can().toggleHeading({ level: 2 }) ?? false,
      canToggleItalic: currentEditor?.can().toggleItalic() ?? false,
      canToggleOrderedList: currentEditor?.can().toggleOrderedList() ?? false,
      canToggleStrike: currentEditor?.can().toggleStrike() ?? false,
      canToggleTaskList: currentEditor?.can().toggleTaskList() ?? false,
      canToggleUnderline: currentEditor?.can().toggleUnderline() ?? false,
      isBold: currentEditor?.isActive('bold') ?? false,
      isBlockquote: currentEditor?.isActive('blockquote') ?? false,
      isBulletList: currentEditor?.isActive('bulletList') ?? false,
      isCallout: currentEditor?.isActive('callout') ?? false,
      isCode: currentEditor?.isActive('code') ?? false,
      isCodeBlock: currentEditor?.isActive('codeBlock') ?? false,
      isHeading2: currentEditor?.isActive('heading', { level: 2 }) ?? false,
      isItalic: currentEditor?.isActive('italic') ?? false,
      isOrderedList: currentEditor?.isActive('orderedList') ?? false,
      isStrike: currentEditor?.isActive('strike') ?? false,
      isTaskList: currentEditor?.isActive('taskList') ?? false,
      isUnderline: currentEditor?.isActive('underline') ?? false,
    }),
  });

  return (
    <div
      aria-label="Formatting"
      className="richer-editor__toolbar"
      role="toolbar"
    >
      <button
        aria-label="Bold"
        aria-pressed={state?.isBold ?? false}
        disabled={!editable || !state?.canToggleBold}
        onClick={() => editor?.chain().focus().toggleBold().run()}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        Bold
      </button>
      <button
        aria-label="Italic"
        aria-pressed={state?.isItalic ?? false}
        disabled={!editable || !state?.canToggleItalic}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        Italic
      </button>
      <button
        aria-label="Underline"
        aria-pressed={state?.isUnderline ?? false}
        disabled={!editable || !state?.canToggleUnderline}
        onClick={() => editor?.chain().focus().toggleUnderline().run()}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        Underline
      </button>
      <button
        aria-label="Strikethrough"
        aria-pressed={state?.isStrike ?? false}
        disabled={!editable || !state?.canToggleStrike}
        onClick={() => editor?.chain().focus().toggleStrike().run()}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        Strikethrough
      </button>
      <button
        aria-label="Inline code"
        aria-pressed={state?.isCode ?? false}
        disabled={!editable || !state?.canToggleCode}
        onClick={() => editor?.chain().focus().toggleCode().run()}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        Inline code
      </button>
      <button
        aria-label="Clear formatting"
        disabled={!editable || !state?.canClearFormatting}
        onClick={() => editor?.chain().focus().unsetAllMarks().run()}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        Clear formatting
      </button>
      <button
        aria-label="Heading 2"
        aria-pressed={state?.isHeading2 ?? false}
        disabled={!editable || !state?.canToggleHeading2}
        onClick={() => editor && toggleHeading2(editor)}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        Heading 2
      </button>
      <button
        aria-label="Bulleted list"
        aria-pressed={state?.isBulletList ?? false}
        disabled={!editable || !state?.canToggleBulletList}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        Bulleted list
      </button>
      <button
        aria-label="Ordered list"
        aria-pressed={state?.isOrderedList ?? false}
        disabled={!editable || !state?.canToggleOrderedList}
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        Ordered list
      </button>
      <button
        aria-label="Task list"
        aria-pressed={state?.isTaskList ?? false}
        disabled={!editable || !state?.canToggleTaskList}
        onClick={() => editor?.chain().focus().toggleTaskList().run()}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        Task list
      </button>
      <button
        aria-label="Blockquote"
        aria-pressed={state?.isBlockquote ?? false}
        disabled={!editable || !state?.canToggleBlockquote}
        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        Blockquote
      </button>
      <button
        aria-label="Callout"
        aria-pressed={state?.isCallout ?? false}
        disabled={!editable || !state?.canToggleCallout}
        onClick={() => editor?.chain().focus().toggleCallout().run()}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        Callout
      </button>
      <button
        aria-label="Code block"
        aria-pressed={state?.isCodeBlock ?? false}
        disabled={!editable || !state?.canToggleCodeBlock}
        onClick={() => editor && toggleCodeBlock(editor)}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        Code block
      </button>
    </div>
  );
}

export function RicherEditor({
  'aria-label': ariaLabel = 'Document editor',
  className,
  defaultDocument,
  document,
  editable = true,
  features,
  onCharacterCountChange,
  onChange,
  placeholder = 'Start writing…',
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
  const onCharacterCountChangeRef = useRef(onCharacterCountChange);
  const onChangeRef = useRef(onChange);
  const placeholderRef = useRef(placeholder);
  const editorExtensionsRef = useRef<
    typeof richerSchemaRegistry.extensions | null
  >(null);

  onCharacterCountChangeRef.current = onCharacterCountChange;
  onChangeRef.current = onChange;
  placeholderRef.current = placeholder;

  if (!editorExtensionsRef.current) {
    editorExtensionsRef.current = richerSchemaRegistry.extensions.map(
      (extension) =>
        extension.name === 'placeholder'
          ? Placeholder.configure({
              placeholder: () => placeholderRef.current,
            })
          : extension,
    );
  }

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
      extensions: editorExtensionsRef.current,
      onCreate: ({ editor: createdEditor }) => {
        onCharacterCountChangeRef.current?.(getCharacterCount(createdEditor));
      },
      onUpdate: ({ editor: updatedEditor }) => {
        const nextDocument: RicherDocument = {
          ...currentDocumentRef.current,
          content: updatedEditor.getJSON(),
        };

        onCharacterCountChangeRef.current?.(getCharacterCount(updatedEditor));

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
    onCharacterCountChangeRef.current?.(getCharacterCount(editor));
  }, [document, editor]);

  const rootClassName = ['richer-editor', className].filter(Boolean).join(' ');

  return (
    <div {...props} className={rootClassName}>
      {features?.bubbleMenu && editable && editor ? (
        <RicherBubbleMenu editor={editor} />
      ) : null}
      {features?.toolbar ? (
        <RicherToolbar editable={editable} editor={editor} />
      ) : null}
      <RicherEditorEditableContext.Provider value={editable}>
        <EditorContent className="richer-editor__body" editor={editor} />
      </RicherEditorEditableContext.Provider>
    </div>
  );
}
