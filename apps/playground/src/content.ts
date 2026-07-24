import { createDocument } from '@bizjs/richer-editor';

export const INITIAL_DOCUMENT = createDocument({
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
          marks: [{ type: 'textStyle', attrs: { color: '#00a870' } }],
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
