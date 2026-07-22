import { createDocument, RicherEditor } from '@bizjs/richer-editor';
import { useState } from 'react';
import '@bizjs/richer-editor/styles.css';

import './App.css';

const INITIAL_DOCUMENT = createDocument({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      attrs: { id: 'playground-introduction' },
      content: [
        {
          type: 'text',
          text: 'Edit this document to inspect the RicherDocument output.',
        },
      ],
    },
  ],
});

function App() {
  const [document, setDocument] = useState(() => INITIAL_DOCUMENT);
  const [editable, setEditable] = useState(true);

  return (
    <main className="playground-shell">
      <header className="playground-header">
        <h1>Richer Editor Playground</h1>
        <p>Controlled editor with live RicherDocument output.</p>
      </header>

      <div className="playground-grid">
        <section className="playground-panel" aria-labelledby="editor-title">
          <div className="playground-panel-header">
            <div>
              <h2 id="editor-title">Editor</h2>
              <p>Changes are written back through the controlled API.</p>
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
              <button
                type="button"
                onClick={() => setDocument(INITIAL_DOCUMENT)}
              >
                Reset
              </button>
            </div>
          </div>

          <RicherEditor
            aria-label="Richer Editor playground"
            className="playground-editor"
            document={document}
            editable={editable}
            onChange={({ document: nextDocument }) => setDocument(nextDocument)}
          />
        </section>

        <section className="playground-panel" aria-labelledby="document-title">
          <div className="playground-panel-header">
            <div>
              <h2 id="document-title">RicherDocument</h2>
              <p>Current versioned document envelope.</p>
            </div>
          </div>

          <pre
            className="playground-document"
            aria-label="Current RicherDocument JSON"
          >
            <code>{JSON.stringify(document, null, 2)}</code>
          </pre>
        </section>
      </div>
    </main>
  );
}

export default App;
