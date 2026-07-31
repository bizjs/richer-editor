import { createDocument, RicherEditor } from '@bizjs/richer-editor';
import '@bizjs/richer-editor/styles.css';

const INITIAL_DOCUMENT = createDocument({
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: {
        id: 'docs-demo-heading',
        level: 2,
        textAlign: null,
      },
      content: [{ type: 'text', text: 'Start writing' }],
    },
    {
      type: 'paragraph',
      attrs: {
        id: 'docs-demo-paragraph',
        textAlign: null,
      },
      content: [
        {
          type: 'text',
          text: 'Select text for formatting, or type / on an empty line.',
        },
      ],
    },
  ],
});

export default function BasicEditorDemo() {
  return (
    <div style={{ minHeight: 320, width: '100%' }}>
      <RicherEditor
        aria-label="Richer Editor documentation demo"
        defaultDocument={INITIAL_DOCUMENT}
        features={{
          bubbleMenu: true,
          search: true,
          slashMenu: true,
          toolbar: true,
        }}
        placeholder="Write something…"
      />
    </div>
  );
}
