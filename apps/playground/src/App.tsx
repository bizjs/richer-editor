import {
  createDocument,
  RicherEditor,
  type JSONContent,
  type RicherEditorCharacterCount,
} from '@bizjs/richer-editor';
import { useState } from 'react';
import '@bizjs/richer-editor/styles.css';

import './App.css';

const INITIAL_DOCUMENT = createDocument({
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { id: 'playground-title', level: 1, textAlign: null },
      content: [{ type: 'text', text: 'Richer Editor' }],
    },
    {
      type: 'heading',
      attrs: { id: 'playground-heading', level: 2, textAlign: null },
      content: [{ type: 'text', text: 'Editing essentials' }],
    },
    {
      type: 'paragraph',
      attrs: { id: 'playground-paragraph', textAlign: null },
      content: [
        {
          type: 'text',
          text: 'Edit ',
        },
        { type: 'text', text: 'formatted', marks: [{ type: 'bold' }] },
        { type: 'text', text: ' content and inspect the document output.' },
      ],
    },
    {
      type: 'paragraph',
      attrs: { id: 'playground-inline-formats', textAlign: null },
      content: [
        { type: 'text', text: 'Extended formats: ' },
        {
          type: 'text',
          text: 'highlight',
          marks: [{ type: 'highlight', attrs: { color: '#fef08a' } }],
        },
        { type: 'text', text: ', ' },
        {
          type: 'text',
          text: 'color',
          marks: [{ type: 'textStyle', attrs: { color: '#2563eb' } }],
        },
        { type: 'text', text: ', H' },
        { type: 'text', text: '2', marks: [{ type: 'subscript' }] },
        { type: 'text', text: 'O and x' },
        { type: 'text', text: '2', marks: [{ type: 'superscript' }] },
        { type: 'text', text: '.' },
      ],
    },
    {
      type: 'bulletList',
      attrs: { id: 'playground-list' },
      content: [
        {
          type: 'listItem',
          attrs: { id: 'playground-list-item' },
          content: [
            {
              type: 'paragraph',
              attrs: { id: 'playground-list-paragraph', textAlign: null },
              content: [{ type: 'text', text: 'Lists keep stable block IDs.' }],
            },
          ],
        },
      ],
    },
    {
      type: 'callout',
      attrs: { id: 'playground-callout', variant: 'tip' },
      content: [
        {
          type: 'paragraph',
          attrs: { id: 'playground-callout-paragraph', textAlign: null },
          content: [
            {
              type: 'text',
              text: 'Callouts preserve their type and stable block IDs.',
            },
          ],
        },
      ],
    },
    {
      type: 'codeBlock',
      attrs: { id: 'playground-code', language: 'javascript' },
      content: [{ type: 'text', text: 'const document = editor.getJSON()' }],
    },
    {
      type: 'taskList',
      attrs: { id: 'playground-tasks' },
      content: [
        {
          type: 'taskItem',
          attrs: { id: 'playground-task-open', checked: false },
          content: [
            {
              type: 'paragraph',
              attrs: {
                id: 'playground-task-open-paragraph',
                textAlign: null,
              },
              content: [{ type: 'text', text: 'Try checking this task.' }],
            },
          ],
        },
        {
          type: 'taskItem',
          attrs: { id: 'playground-task-done', checked: true },
          content: [
            {
              type: 'paragraph',
              attrs: {
                id: 'playground-task-done-paragraph',
                textAlign: null,
              },
              content: [{ type: 'text', text: 'Task list schema registered.' }],
            },
          ],
        },
      ],
    },
    {
      type: 'details',
      attrs: { id: 'playground-details' },
      content: [
        {
          type: 'detailsSummary',
          attrs: { id: 'playground-details-summary' },
          content: [{ type: 'text', text: 'Why RicherDocument?' }],
        },
        {
          type: 'detailsContent',
          attrs: { id: 'playground-details-content' },
          content: [
            {
              type: 'paragraph',
              attrs: {
                id: 'playground-details-content-paragraph',
                textAlign: null,
              },
              content: [
                {
                  type: 'text',
                  text: 'Schema-first content remains portable.',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'heading',
      attrs: {
        id: 'playground-structured-heading',
        level: 2,
        textAlign: null,
      },
      content: [{ type: 'text', text: 'Structured content' }],
    },
    {
      type: 'table',
      attrs: { id: 'playground-table' },
      content: [
        {
          type: 'tableRow',
          attrs: { id: 'playground-table-header-row' },
          content: [
            {
              type: 'tableHeader',
              attrs: {
                id: 'playground-table-header-feature',
                colspan: 1,
                rowspan: 1,
                colwidth: null,
                align: null,
              },
              content: [
                {
                  type: 'paragraph',
                  attrs: {
                    id: 'playground-table-header-feature-paragraph',
                    textAlign: null,
                  },
                  content: [{ type: 'text', text: 'Feature' }],
                },
              ],
            },
            {
              type: 'tableHeader',
              attrs: {
                id: 'playground-table-header-state',
                colspan: 1,
                rowspan: 1,
                colwidth: null,
                align: null,
              },
              content: [
                {
                  type: 'paragraph',
                  attrs: {
                    id: 'playground-table-header-state-paragraph',
                    textAlign: null,
                  },
                  content: [{ type: 'text', text: 'State' }],
                },
              ],
            },
          ],
        },
        {
          type: 'tableRow',
          attrs: { id: 'playground-table-row' },
          content: [
            {
              type: 'tableCell',
              attrs: {
                id: 'playground-table-cell-feature',
                colspan: 1,
                rowspan: 1,
                colwidth: null,
                align: null,
              },
              content: [
                {
                  type: 'paragraph',
                  attrs: {
                    id: 'playground-table-cell-feature-paragraph',
                    textAlign: null,
                  },
                  content: [{ type: 'text', text: 'TableKit' }],
                },
              ],
            },
            {
              type: 'tableCell',
              attrs: {
                id: 'playground-table-cell-state',
                colspan: 1,
                rowspan: 1,
                colwidth: null,
                align: null,
              },
              content: [
                {
                  type: 'paragraph',
                  attrs: {
                    id: 'playground-table-cell-state-paragraph',
                    textAlign: null,
                  },
                  content: [{ type: 'text', text: 'Registered' }],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'paragraph',
      attrs: { id: 'playground-typography', textAlign: null },
      content: [
        {
          type: 'text',
          text: 'Typography input rules are active. Type two hyphens at the end: ',
        },
      ],
    },
    {
      type: 'paragraph',
      attrs: { id: 'playground-command-line', textAlign: null },
    },
  ],
});

const EMPTY_DOCUMENT = createDocument({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      attrs: { id: 'playground-empty', textAlign: null },
    },
  ],
});

interface OutlineItem {
  id: string;
  level: number;
  text: string;
}

function getNodeText(node: JSONContent): string {
  if (typeof node.text === 'string') {
    return node.text;
  }

  return node.content?.map(getNodeText).join('') ?? '';
}

function getDocumentOutline(document: JSONContent): OutlineItem[] {
  return (document.content ?? []).flatMap((node, index) => {
    if (node.type !== 'heading') {
      return [];
    }

    const id =
      typeof node.attrs?.id === 'string' ? node.attrs.id : `heading-${index}`;
    const level = typeof node.attrs?.level === 'number' ? node.attrs.level : 1;

    return [{ id, level, text: getNodeText(node) || 'Untitled heading' }];
  });
}

function App() {
  const [document, setDocument] = useState(() => INITIAL_DOCUMENT);
  const [editable, setEditable] = useState(true);
  const [characterCount, setCharacterCount] =
    useState<RicherEditorCharacterCount | null>(null);
  const outline = getDocumentOutline(document.content);

  return (
    <main className="playground-shell">
      <header className="playground-document-bar">
        <div className="playground-document-meta">
          <strong>Richer Editor</strong>
          <span>Playground</span>
          <span className="playground-save-status" aria-live="polite">
            <span aria-hidden="true" />
            {characterCount
              ? `${characterCount.characters} characters`
              : 'Preparing editor'}
          </span>
        </div>

        <div className="playground-controls">
          <label className="playground-toggle">
            <input
              type="checkbox"
              checked={editable}
              onChange={(event) => setEditable(event.target.checked)}
            />
            Editable
          </label>
          <button type="button" onClick={() => setDocument(EMPTY_DOCUMENT)}>
            New
          </button>
          <button type="button" onClick={() => setDocument(INITIAL_DOCUMENT)}>
            Reset
          </button>
        </div>
      </header>

      <div className="playground-shortcuts" aria-label="Editor shortcuts">
        <strong>Quick start</strong>
        <span>
          Type <kbd>/</kbd> on the empty line to insert a block
        </span>
        <span>
          Press <kbd>⌘/Ctrl + F</kbd> to find and replace
        </span>
        <span>Select text for the floating format menu</span>
      </div>

      <div className="playground-workspace">
        <section
          className="playground-document-pane"
          aria-label="Editable document"
        >
          <RicherEditor
            aria-label="Richer Editor playground"
            className="playground-editor"
            document={document}
            editable={editable}
            features={{
              bubbleMenu: true,
              focusMode: true,
              search: true,
              slashMenu: true,
              toolbar: true,
            }}
            onCharacterCountChange={setCharacterCount}
            onChange={({ document: nextDocument }) => setDocument(nextDocument)}
            placeholder="Type / to insert a block…"
          />
        </section>

        <aside className="playground-sidebar" aria-label="Document tools">
          <nav aria-labelledby="outline-title">
            <h2 id="outline-title">Outline</h2>
            {outline.length > 0 ? (
              <ol className="playground-outline">
                {outline.map((item) => (
                  <li
                    className={`playground-outline-level-${Math.min(item.level, 3)}`}
                    key={item.id}
                  >
                    {item.text}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="playground-empty-state">
                Add a heading to build the outline.
              </p>
            )}
          </nav>

          <details className="playground-inspector">
            <summary>RicherDocument</summary>
            <p>Live versioned JSON for integration debugging.</p>
            <pre
              className="playground-document"
              aria-label="Current RicherDocument JSON"
            >
              <code>{JSON.stringify(document, null, 2)}</code>
            </pre>
          </details>
        </aside>
      </div>
    </main>
  );
}

export default App;
