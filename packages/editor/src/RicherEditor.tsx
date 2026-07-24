import type { Editor, Range } from '@tiptap/core';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { BubbleMenu, type BubbleMenuProps } from '@tiptap/react/menus';
import { Placeholder } from '@tiptap/extensions/placeholder';
import { Selection } from '@tiptap/pm/state';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from 'react';

import {
  createDocument,
  extractContent,
  type RicherDocument,
} from './document';
import { RicherEditorEditableContext } from './editor-context';
import { FocusMode } from './focus-mode';
import { richerSchemaRegistry } from './schema';
import { Search, searchPluginKey } from './search';

export interface RicherEditorChange {
  document: RicherDocument;
}

export interface RicherEditorCharacterCount {
  characters: number;
  words: number;
}

export interface RicherEditorFeatures {
  bubbleMenu?: boolean;
  focusMode?: boolean;
  outline?: boolean;
  search?: boolean;
  slashMenu?: boolean;
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

function getVerticalScrollContainer(element: HTMLElement): HTMLElement | null {
  let candidate = element.parentElement;

  while (candidate && candidate !== document.body) {
    const { overflowY } = window.getComputedStyle(candidate);

    if (
      /(auto|overlay|scroll)/.test(overflowY) &&
      candidate.scrollHeight > candidate.clientHeight
    ) {
      return candidate;
    }

    candidate = candidate.parentElement;
  }

  return null;
}

function centerEditorSelection(editor: Editor): void {
  const coordinates = editor.view.coordsAtPos(editor.state.selection.head);
  const scrollContainer = getVerticalScrollContainer(editor.view.dom);
  const behavior: ScrollBehavior = window.matchMedia?.(
    '(prefers-reduced-motion: reduce)',
  ).matches
    ? 'auto'
    : 'smooth';

  if (scrollContainer) {
    const containerRect = scrollContainer.getBoundingClientRect();

    scrollContainer.scrollBy({
      behavior,
      top:
        coordinates.top -
        (containerRect.top + scrollContainer.clientHeight * 0.4),
    });
    return;
  }

  window.scrollBy({
    behavior,
    top: coordinates.top - window.innerHeight * 0.4,
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

interface SlashMenuMatch {
  from: number;
  query: string;
  to: number;
}

interface SlashMenuItem {
  glyph: string;
  group: SlashMenuGroup;
  hint?: string;
  key: string;
  keywords: string;
  label: string;
  run: (editor: Editor, range: Range) => void;
}

type SlashMenuGroup = 'Basic blocks' | 'Lists' | 'Advanced blocks';

const SLASH_MENU_GROUPS: SlashMenuGroup[] = [
  'Basic blocks',
  'Lists',
  'Advanced blocks',
];

const SLASH_MENU_ITEMS: SlashMenuItem[] = [
  {
    glyph: 'T',
    group: 'Basic blocks',
    key: 'text',
    keywords: 'paragraph plain 正文 文本 zhengwen wenben',
    label: 'Text',
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    glyph: 'H1',
    group: 'Basic blocks',
    hint: '#',
    key: 'heading1',
    keywords: 'h1 title 一级标题 标题 biaoti yiji',
    label: 'Heading 1',
    run: (editor, range) => {
      const blockId = getSingleSelectedBlockId(editor);
      const chain = editor
        .chain()
        .focus()
        .deleteRange(range)
        .setHeading({ level: 1 });

      if (blockId) {
        chain.updateAttributes('heading', { id: blockId });
      }

      chain.run();
    },
  },
  {
    glyph: 'H2',
    group: 'Basic blocks',
    hint: '##',
    key: 'heading2',
    keywords: 'h2 subtitle 二级标题 标题 biaoti erji',
    label: 'Heading 2',
    run: (editor, range) => {
      const blockId = getSingleSelectedBlockId(editor);
      const chain = editor
        .chain()
        .focus()
        .deleteRange(range)
        .setHeading({ level: 2 });

      if (blockId) {
        chain.updateAttributes('heading', { id: blockId });
      }

      chain.run();
    },
  },
  {
    glyph: 'H3',
    group: 'Basic blocks',
    hint: '###',
    key: 'heading3',
    keywords: 'h3 三级标题 标题 biaoti sanji',
    label: 'Heading 3',
    run: (editor, range) => {
      const blockId = getSingleSelectedBlockId(editor);
      const chain = editor
        .chain()
        .focus()
        .deleteRange(range)
        .setHeading({ level: 3 });

      if (blockId) {
        chain.updateAttributes('heading', { id: blockId });
      }

      chain.run();
    },
  },
  {
    glyph: '•',
    group: 'Lists',
    hint: '-',
    key: 'bulletList',
    keywords: 'ul unordered 无序列表 列表 liebiao wuxu',
    label: 'Bullet list',
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    glyph: '1.',
    group: 'Lists',
    hint: '1.',
    key: 'orderedList',
    keywords: 'ol numbered 有序列表 列表 liebiao youxu',
    label: 'Ordered list',
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    glyph: '□',
    group: 'Lists',
    hint: '[]',
    key: 'taskList',
    keywords: 'todo checkbox check 任务 待办 清单 renwu daiban',
    label: 'Task list',
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    glyph: '▦',
    group: 'Advanced blocks',
    key: 'table',
    keywords: 'grid rows columns 表格 biaoge bg',
    label: 'Table',
    run: (editor, range) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ cols: 3, rows: 3, withHeaderRow: true })
        .run();
    },
  },
  {
    glyph: '“',
    group: 'Advanced blocks',
    hint: '>',
    key: 'quote',
    keywords: 'blockquote citation 引用 yinyong',
    label: 'Quote',
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    glyph: '</>',
    group: 'Advanced blocks',
    hint: '```',
    key: 'codeBlock',
    keywords: 'snippet pre fence 代码 代码块 daima',
    label: 'Code block',
    run: (editor, range) => {
      const blockId = getSingleSelectedBlockId(editor);
      const chain = editor.chain().focus().deleteRange(range).setCodeBlock();

      if (blockId) {
        chain.updateAttributes('codeBlock', { id: blockId });
      }

      chain.run();
    },
  },
  {
    glyph: '!',
    group: 'Advanced blocks',
    key: 'callout',
    keywords: 'info tip warning danger note 信息块 提示 xinxikuai tishi',
    label: 'Callout',
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleCallout().run();
    },
  },
  {
    glyph: '⌄',
    group: 'Advanced blocks',
    key: 'details',
    keywords: 'details collapse fold 折叠 zhedie',
    label: 'Toggle',
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).setDetails().run();
    },
  },
  {
    glyph: '—',
    group: 'Advanced blocks',
    hint: '---',
    key: 'divider',
    keywords: 'hr horizontal rule separator 分割线 分隔线 fengexian fgx',
    label: 'Divider',
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
];

function getFilteredSlashMenuItems(query: string): SlashMenuItem[] {
  const normalizedQuery = query.toLowerCase().trim();

  return normalizedQuery
    ? SLASH_MENU_ITEMS.filter(
        ({ keywords, label }) =>
          label.toLowerCase().includes(normalizedQuery) ||
          keywords.includes(normalizedQuery),
      )
    : SLASH_MENU_ITEMS;
}

function getSlashMenuMatch(editor: Editor): SlashMenuMatch | null {
  const { selection } = editor.state;

  if (!selection.empty || selection.$from.parent.type.name !== 'paragraph') {
    return null;
  }

  const textBefore = selection.$from.parent.textBetween(
    0,
    selection.$from.parentOffset,
  );
  const match = /(?:^|\s)\/([^\s/]*)$/.exec(textBefore);

  if (!match) {
    return null;
  }

  const query = match[1] ?? '';

  return {
    from: selection.from - query.length - 1,
    query,
    to: selection.from,
  };
}

function RicherSlashMenu({
  editor,
  match,
  menuId,
  onSelectedIndexChange,
  selectedIndex,
}: {
  editor: Editor;
  match: SlashMenuMatch;
  menuId: string;
  onSelectedIndexChange: (index: number) => void;
  selectedIndex: number;
}) {
  const items = getFilteredSlashMenuItems(match.query);
  const style = getSlashMenuStyle(editor, match.from);

  return (
    <div
      aria-label="Insert block"
      className="richer-editor__slash-menu"
      id={menuId}
      role="listbox"
      style={style}
    >
      {items.length === 0 ? (
        <div aria-label="No commands found" role="status">
          No commands found
        </div>
      ) : null}
      {SLASH_MENU_GROUPS.map((group) => {
        const groupItems = items.filter((item) => item.group === group);

        if (groupItems.length === 0) {
          return null;
        }

        return (
          <div className="richer-editor__slash-group" key={group}>
            <div className="richer-editor__slash-group-label">{group}</div>
            {groupItems.map((item) => {
              const index = items.indexOf(item);

              return (
                <button
                  aria-label={item.label}
                  aria-selected={index === selectedIndex}
                  id={`${menuId}-${item.key}`}
                  key={item.key}
                  onClick={() =>
                    item.run(editor, { from: match.from, to: match.to })
                  }
                  onMouseEnter={() => onSelectedIndexChange(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  role="option"
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className="richer-editor__slash-glyph"
                  >
                    {item.glyph}
                  </span>
                  <span>{item.label}</span>
                  {item.hint ? <kbd aria-hidden="true">{item.hint}</kbd> : null}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function getSlashMenuStyle(
  editor: Editor,
  position: number,
): CSSProperties | undefined {
  try {
    const rect = editor.view.coordsAtPos(position);
    const menuWidth = 320;
    const viewportPadding = 8;
    const left = Math.min(
      Math.max(rect.left, viewportPadding),
      Math.max(
        viewportPadding,
        window.innerWidth - menuWidth - viewportPadding,
      ),
    );

    if (window.innerHeight - rect.bottom < 288) {
      return {
        bottom: window.innerHeight - rect.top + 4,
        left,
      };
    }

    return {
      left,
      top: rect.bottom + 4,
    };
  } catch {
    return undefined;
  }
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
          <strong aria-hidden="true">B</strong>
        </button>
        <button
          aria-label="Italic"
          aria-pressed={state.isItalic}
          disabled={!state.canToggleItalic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          onMouseDown={(event) => event.preventDefault()}
          type="button"
        >
          <em aria-hidden="true">I</em>
        </button>
        <button
          aria-label="Underline"
          aria-pressed={state.isUnderline}
          disabled={!state.canToggleUnderline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          onMouseDown={(event) => event.preventDefault()}
          type="button"
        >
          <span className="richer-editor__toolbar-underline" aria-hidden="true">
            U
          </span>
        </button>
        <button
          aria-label="Inline code"
          aria-pressed={state.isCode}
          disabled={!state.canToggleCode}
          onClick={() => editor.chain().focus().toggleCode().run()}
          onMouseDown={(event) => event.preventDefault()}
          type="button"
        >
          <span className="richer-editor__toolbar-code" aria-hidden="true">
            {'</>'}
          </span>
        </button>
      </div>
    </BubbleMenu>
  );
}

function RicherToolbar({
  editable,
  editor,
  focusMode,
  onFocusModeChange,
}: {
  editable: boolean;
  editor: Editor | null;
  focusMode?: boolean;
  onFocusModeChange?: () => void;
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
        <strong aria-hidden="true">B</strong>
      </button>
      <button
        aria-label="Italic"
        aria-pressed={state?.isItalic ?? false}
        disabled={!editable || !state?.canToggleItalic}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        <em aria-hidden="true">I</em>
      </button>
      <button
        aria-label="Underline"
        aria-pressed={state?.isUnderline ?? false}
        disabled={!editable || !state?.canToggleUnderline}
        onClick={() => editor?.chain().focus().toggleUnderline().run()}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        <span className="richer-editor__toolbar-underline" aria-hidden="true">
          U
        </span>
      </button>
      <button
        aria-label="Strikethrough"
        aria-pressed={state?.isStrike ?? false}
        disabled={!editable || !state?.canToggleStrike}
        onClick={() => editor?.chain().focus().toggleStrike().run()}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        <s aria-hidden="true">S</s>
      </button>
      <button
        aria-label="Inline code"
        aria-pressed={state?.isCode ?? false}
        disabled={!editable || !state?.canToggleCode}
        onClick={() => editor?.chain().focus().toggleCode().run()}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        <span className="richer-editor__toolbar-code" aria-hidden="true">
          {'</>'}
        </span>
      </button>
      <button
        aria-label="Clear formatting"
        disabled={!editable || !state?.canClearFormatting}
        onClick={() => editor?.chain().focus().unsetAllMarks().run()}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        <span className="richer-editor__toolbar-text" aria-hidden="true">
          Clear
        </span>
      </button>
      <button
        aria-label="Heading 2"
        aria-pressed={state?.isHeading2 ?? false}
        disabled={!editable || !state?.canToggleHeading2}
        onClick={() => editor && toggleHeading2(editor)}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        <span className="richer-editor__toolbar-text" aria-hidden="true">
          H2
        </span>
      </button>
      <button
        aria-label="Bulleted list"
        aria-pressed={state?.isBulletList ?? false}
        disabled={!editable || !state?.canToggleBulletList}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        <span className="richer-editor__toolbar-list" aria-hidden="true">
          • —
        </span>
      </button>
      <button
        aria-label="Ordered list"
        aria-pressed={state?.isOrderedList ?? false}
        disabled={!editable || !state?.canToggleOrderedList}
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        <span className="richer-editor__toolbar-list" aria-hidden="true">
          1. —
        </span>
      </button>
      <button
        aria-label="Task list"
        aria-pressed={state?.isTaskList ?? false}
        disabled={!editable || !state?.canToggleTaskList}
        onClick={() => editor?.chain().focus().toggleTaskList().run()}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        <span className="richer-editor__toolbar-list" aria-hidden="true">
          □ —
        </span>
      </button>
      <button
        aria-label="Blockquote"
        aria-pressed={state?.isBlockquote ?? false}
        disabled={!editable || !state?.canToggleBlockquote}
        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        <span className="richer-editor__toolbar-quote" aria-hidden="true">
          “
        </span>
      </button>
      <button
        aria-label="Callout"
        aria-pressed={state?.isCallout ?? false}
        disabled={!editable || !state?.canToggleCallout}
        onClick={() => editor?.chain().focus().toggleCallout().run()}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        <span className="richer-editor__toolbar-callout" aria-hidden="true">
          !
        </span>
      </button>
      <button
        aria-label="Code block"
        aria-pressed={state?.isCodeBlock ?? false}
        disabled={!editable || !state?.canToggleCodeBlock}
        onClick={() => editor && toggleCodeBlock(editor)}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        <span className="richer-editor__toolbar-code" aria-hidden="true">
          {'{ }'}
        </span>
      </button>
      {onFocusModeChange ? (
        <button
          aria-label="Focus mode"
          aria-pressed={focusMode}
          className="richer-editor__toolbar-focus"
          disabled={!editable || !editor}
          onClick={onFocusModeChange}
          onMouseDown={(event) => event.preventDefault()}
          type="button"
        >
          <span aria-hidden="true">Focus</span>
        </button>
      ) : null}
    </div>
  );
}

interface RicherOutlineItem {
  id: string;
  level: number;
  position: number;
  text: string;
}

function getOutlineState(editor: Editor): {
  activeId: string | null;
  items: RicherOutlineItem[];
} {
  const items: RicherOutlineItem[] = [];
  let activeId: string | null = null;

  editor.state.doc.descendants((node, position) => {
    if (node.type.name !== 'heading' || typeof node.attrs.id !== 'string') {
      return;
    }

    const item = {
      id: node.attrs.id,
      level: typeof node.attrs.level === 'number' ? node.attrs.level : 1,
      position,
      text: node.textContent || 'Untitled heading',
    };

    items.push(item);

    if (position <= editor.state.selection.from) {
      activeId = item.id;
    }
  });

  return { activeId, items };
}

function navigateToOutlineItem(editor: Editor, item: RicherOutlineItem): void {
  const position = Math.min(item.position + 1, editor.state.doc.content.size);
  const transaction = editor.state.tr
    .setSelection(Selection.near(editor.state.doc.resolve(position)))
    .scrollIntoView();

  transaction.setMeta('addToHistory', false);
  editor.view.dispatch(transaction);
  editor.view.dom.focus({ preventScroll: true });
}

function RicherOutline({ editor }: { editor: Editor }) {
  const contentId = useId();
  const [open, setOpen] = useState(true);
  const state = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => getOutlineState(currentEditor),
  });

  return (
    <nav aria-label="Document outline" className="richer-editor__outline">
      <button
        aria-controls={contentId}
        aria-expanded={open}
        className="richer-editor__outline-toggle"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span>Outline</span>
        <svg
          aria-hidden="true"
          fill="none"
          height="16"
          viewBox="0 0 16 16"
          width="16"
        >
          <path
            d={open ? 'M3.5 6 8 10.5 12.5 6' : 'M6 3.5 10.5 8 6 12.5'}
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      </button>
      {open ? (
        <div className="richer-editor__outline-content" id={contentId}>
          {state.items.length > 0 ? (
            <ol className="richer-editor__outline-list">
              {state.items.map((item) => (
                <li data-level={item.level} key={item.id}>
                  <button
                    aria-current={
                      item.id === state.activeId ? 'location' : undefined
                    }
                    aria-label={`${item.text}, heading level ${item.level}`}
                    onClick={() => navigateToOutlineItem(editor, item)}
                    type="button"
                  >
                    {item.text}
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="richer-editor__outline-empty">
              Add a heading to build the outline.
            </p>
          )}
        </div>
      ) : null}
    </nav>
  );
}

function RicherSearchPanel({
  editable,
  editor,
  onClose,
}: {
  editable: boolean;
  editor: Editor;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [replacement, setReplacement] = useState('');
  const [term, setTerm] = useState('');
  const state = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      const searchState = searchPluginKey.getState(currentEditor.state);

      return {
        activeIndex: searchState?.activeIndex ?? 0,
        count: searchState?.matches.length ?? 0,
        term: searchState?.term ?? '',
      };
    },
  });

  useEffect(() => {
    inputRef.current?.focus();

    return () => {
      editor.commands.clearSearch();
    };
  }, [editor]);

  const close = () => {
    onClose();
    editor.view.focus();
  };

  return (
    <div
      aria-label="Find and replace"
      className="richer-editor__search"
      onKeyDown={(event) => {
        if (event.key === 'Enter' && event.target === inputRef.current) {
          event.preventDefault();

          if (event.shiftKey) {
            editor.commands.findPrevious();
          } else {
            editor.commands.findNext();
          }

          return;
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          close();
        }
      }}
      role="search"
    >
      <div className="richer-editor__search-fields">
        <label>
          <span>Find</span>
          <input
            aria-label="Find"
            onChange={(event) => {
              setTerm(event.target.value);
              editor.commands.setSearchTerm(event.target.value);
            }}
            ref={inputRef}
            type="search"
            value={term}
          />
        </label>
        <label>
          <span>Replace</span>
          <input
            aria-label="Replace"
            disabled={!editable}
            onChange={(event) => setReplacement(event.target.value)}
            type="text"
            value={replacement}
          />
        </label>
      </div>
      <div className="richer-editor__search-navigation">
        <span aria-label="Search matches" role="status">
          {state.count > 0
            ? `${state.activeIndex + 1}/${state.count}`
            : state.term
              ? 'No matches'
              : '0/0'}
        </span>
        <button
          aria-label="Previous match"
          disabled={state.count === 0}
          onClick={() => editor.commands.findPrevious()}
          type="button"
        >
          Previous
        </button>
        <button
          aria-label="Next match"
          disabled={state.count === 0}
          onClick={() => editor.commands.findNext()}
          type="button"
        >
          Next
        </button>
      </div>
      <div className="richer-editor__search-actions">
        <button
          aria-label="Replace current"
          disabled={!editable || state.count === 0}
          onClick={() => editor.commands.replaceCurrent(replacement)}
          type="button"
        >
          Replace
        </button>
        <button
          aria-label="Replace all"
          disabled={!editable || state.count === 0}
          onClick={() => editor.commands.replaceAll(replacement)}
          type="button"
        >
          Replace all
        </button>
      </div>
      <button
        aria-label="Close search"
        className="richer-editor__search-close"
        onClick={close}
        type="button"
      >
        Close
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
  onKeyDown,
  placeholder = 'Start writing…',
  ...props
}: RicherEditorProps) {
  const isControlled = document !== undefined;
  const slashMenuId = useId();
  const initialModeRef = useRef(isControlled);
  const [focusMode, setFocusMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dismissedSlashMatch, setDismissedSlashMatch] = useState<string | null>(
    null,
  );
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
  const slashMenuKeyDownRef = useRef<(event: KeyboardEvent) => boolean>(
    () => false,
  );

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
    editorExtensionsRef.current = [
      ...richerSchemaRegistry.extensions.map((extension) =>
        extension.name === 'placeholder'
          ? Placeholder.configure({
              placeholder: () => placeholderRef.current,
            })
          : extension,
      ),
      Search,
      FocusMode,
    ];
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
          tabindex: '0',
        },
        handleKeyDown: (_view, event) => slashMenuKeyDownRef.current(event),
      },
      extensions: editorExtensionsRef.current,
      onCreate: ({ editor: createdEditor }) => {
        onCharacterCountChangeRef.current?.(getCharacterCount(createdEditor));
      },
      onTransaction: () => {
        setDismissedSlashMatch(null);
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
  const slashMenuState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) =>
      currentEditor
        ? {
            focused: currentEditor.isFocused,
            match: getSlashMenuMatch(currentEditor),
          }
        : { focused: false, match: null },
  });
  const slashMenuMatch = slashMenuState.match;
  const slashMenuMatchKey = slashMenuMatch
    ? `${slashMenuMatch.from}:${slashMenuMatch.to}:${slashMenuMatch.query}`
    : null;
  const slashMenuOpen = Boolean(
    features?.slashMenu &&
    editable &&
    slashMenuState.focused &&
    slashMenuMatch &&
    slashMenuMatchKey !== dismissedSlashMatch,
  );
  const activeSlashMenuItem = slashMenuMatch
    ? (getFilteredSlashMenuItems(slashMenuMatch.query)[selectedSlashIndex] ??
      getFilteredSlashMenuItems(slashMenuMatch.query)[0])
    : undefined;

  useEffect(() => {
    if (!features?.search) {
      setSearchOpen(false);
    }
  }, [features?.search]);

  useEffect(() => {
    if (!editor || (features?.focusMode && editable) || !focusMode) {
      return;
    }

    setFocusMode(false);
    editor.commands.setFocusMode(false);
  }, [editable, editor, features?.focusMode, focusMode]);

  useEffect(() => {
    if (!editor || !focusMode) {
      return;
    }

    const centerSelection = () => centerEditorSelection(editor);

    centerSelection();
    editor.on('selectionUpdate', centerSelection);

    return () => {
      editor.off('selectionUpdate', centerSelection);
    };
  }, [editor, focusMode]);

  useEffect(() => {
    setSelectedSlashIndex(0);
  }, [slashMenuMatchKey]);

  slashMenuKeyDownRef.current = (event) => {
    if (!slashMenuOpen || !slashMenuMatch || !slashMenuMatchKey || !editor) {
      return false;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setDismissedSlashMatch(slashMenuMatchKey);
      return true;
    }

    const items = getFilteredSlashMenuItems(slashMenuMatch.query);

    if (event.key === 'ArrowDown' && items.length > 0) {
      event.preventDefault();
      setSelectedSlashIndex((current) => (current + 1) % items.length);
      return true;
    }

    if (event.key === 'ArrowUp' && items.length > 0) {
      event.preventDefault();
      setSelectedSlashIndex(
        (current) => (current - 1 + items.length) % items.length,
      );
      return true;
    }

    if (event.key === 'Enter') {
      const item = items[selectedSlashIndex] ?? items[0];

      if (!item) {
        return false;
      }

      event.preventDefault();
      item.run(editor, {
        from: slashMenuMatch.from,
        to: slashMenuMatch.to,
      });
      return true;
    }

    return false;
  };

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
          tabindex: '0',
        },
        handleKeyDown: (_view, event) => slashMenuKeyDownRef.current(event),
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

  useEffect(() => {
    if (!editor) {
      return;
    }

    const editorElement = editor.view.dom;

    if (!slashMenuOpen || !activeSlashMenuItem) {
      editorElement.removeAttribute('aria-activedescendant');
      editorElement.removeAttribute('aria-controls');
      return;
    }

    editorElement.setAttribute(
      'aria-activedescendant',
      `${slashMenuId}-${activeSlashMenuItem.key}`,
    );
    editorElement.setAttribute('aria-controls', slashMenuId);

    return () => {
      editorElement.removeAttribute('aria-activedescendant');
      editorElement.removeAttribute('aria-controls');
    };
  }, [activeSlashMenuItem, editor, slashMenuId, slashMenuOpen]);

  const rootClassName = [
    'richer-editor',
    focusMode && 'richer-editor--focus-mode',
    features?.outline && 'richer-editor--with-outline',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const toggleFocusMode = () => {
    if (!editor) {
      return;
    }

    const enabled = !focusMode;

    setFocusMode(enabled);
    editor.commands.setFocusMode(enabled);
  };

  return (
    <div
      {...props}
      className={rootClassName}
      onKeyDown={(event) => {
        onKeyDown?.(event);

        if (
          !event.defaultPrevented &&
          features?.search &&
          (event.metaKey || event.ctrlKey) &&
          event.key.toLocaleLowerCase() === 'f'
        ) {
          event.preventDefault();
          setSearchOpen(true);
        }
      }}
    >
      {features?.bubbleMenu && editable && editor ? (
        <RicherBubbleMenu editor={editor} />
      ) : null}
      {features?.toolbar ? (
        <RicherToolbar
          editable={editable}
          editor={editor}
          focusMode={focusMode}
          {...(features.focusMode && editable && editor
            ? { onFocusModeChange: toggleFocusMode }
            : {})}
        />
      ) : null}
      {features?.focusMode && !features.toolbar && editable && editor ? (
        <button
          aria-label="Focus mode"
          aria-pressed={focusMode}
          className="richer-editor__focus-toggle"
          onClick={toggleFocusMode}
          type="button"
        >
          Focus mode
        </button>
      ) : null}
      {features?.search && searchOpen && editor ? (
        <RicherSearchPanel
          editable={editable}
          editor={editor}
          onClose={() => setSearchOpen(false)}
        />
      ) : null}
      {slashMenuOpen && editor && slashMenuMatch ? (
        <RicherSlashMenu
          editor={editor}
          match={slashMenuMatch}
          menuId={slashMenuId}
          onSelectedIndexChange={setSelectedSlashIndex}
          selectedIndex={selectedSlashIndex}
        />
      ) : null}
      <div className="richer-editor__workspace">
        <RicherEditorEditableContext.Provider value={editable}>
          <EditorContent className="richer-editor__body" editor={editor} />
        </RicherEditorEditableContext.Provider>
        {features?.outline && editor ? <RicherOutline editor={editor} /> : null}
      </div>
    </div>
  );
}
