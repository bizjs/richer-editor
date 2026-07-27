import { getSchema, type Extensions, type JSONContent } from '@tiptap/core';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import {
  Details,
  DetailsContent,
  DetailsSummary,
} from '@tiptap/extension-details';
import { Highlight } from '@tiptap/extension-highlight';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TableKit } from '@tiptap/extension-table';
import { TextAlign } from '@tiptap/extension-text-align';
import { Color, TextStyle } from '@tiptap/extension-text-style';
import Typography from '@tiptap/extension-typography';
import { generateUniqueIds, UniqueID } from '@tiptap/extension-unique-id';
import { CharacterCount } from '@tiptap/extensions/character-count';
import { Placeholder } from '@tiptap/extensions/placeholder';
import type { Schema } from '@tiptap/pm/model';
import StarterKit from '@tiptap/starter-kit';
import { common, createLowlight } from 'lowlight';

import { Callout } from './callout';

export interface RicherSchemaRegistry {
  extensions: Extensions;
  schema: Schema;
}

export type BlockIdGenerator = () => string;

export interface NormalizeBlockIdsOptions {
  generateId?: BlockIdGenerator;
}

const lowlight = createLowlight(common);

const blockNodeTypes = [
  'blockquote',
  'bulletList',
  'callout',
  'codeBlock',
  'details',
  'detailsContent',
  'detailsSummary',
  'heading',
  'horizontalRule',
  'listItem',
  'orderedList',
  'paragraph',
  'taskItem',
  'taskList',
  'table',
  'tableCell',
  'tableHeader',
  'tableRow',
];

function createCoreExtensions(generateId?: BlockIdGenerator): Extensions {
  const uniqueId = UniqueID.configure({
    types: blockNodeTypes,
    ...(generateId ? { generateID: generateId } : {}),
  });

  return [
    StarterKit.configure({ codeBlock: false, trailingNode: false }),
    CodeBlockLowlight.configure({ lowlight }),
    TaskList,
    TaskItem.configure({
      nested: true,
      HTMLAttributes: { class: 'richer-editor__task-item' },
    }),
    TableKit.configure({ table: { resizable: true } }),
    Callout,
    Details.configure({
      persist: false,
      renderToggleButton: ({ element, isOpen, node }) => {
        if (!element.querySelector('.richer-editor__details-toggle-icon')) {
          const icon = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'svg',
          );
          const path = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'path',
          );

          icon.setAttribute('class', 'richer-editor__details-toggle-icon');
          icon.setAttribute('aria-hidden', 'true');
          icon.setAttribute('fill', 'none');
          icon.setAttribute('height', '16');
          icon.setAttribute('stroke', 'currentColor');
          icon.setAttribute('stroke-linecap', 'round');
          icon.setAttribute('stroke-linejoin', 'round');
          icon.setAttribute('stroke-width', '1.5');
          icon.setAttribute('viewBox', '0 0 16 16');
          icon.setAttribute('width', '16');
          path.setAttribute('d', 'M5.75 3.5 10.25 8 5.75 12.5');
          icon.append(path);
          element.append(icon);
        }

        const summary = node.firstChild?.textContent.trim() || 'details';

        element.setAttribute(
          'aria-label',
          `${isOpen ? 'Collapse' : 'Expand'} details: ${summary}`,
        );
      },
    }),
    DetailsSummary,
    DetailsContent,
    Highlight.configure({ multicolor: true }),
    TextStyle,
    Color,
    Subscript,
    Superscript,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Typography,
    Placeholder,
    CharacterCount,
    uniqueId,
  ];
}

const coreExtensions = createCoreExtensions();
const coreSchema = getSchema(coreExtensions);
const coreExtensionNames = new Set([
  ...coreExtensions.map(({ name }) => name),
  ...Object.keys(coreSchema.nodes),
  ...Object.keys(coreSchema.marks),
  'dropCursor',
  'gapCursor',
  'listKeymap',
  'undoRedo',
]);

export function normalizeBlockIds(
  content: JSONContent,
  options: NormalizeBlockIdsOptions = {},
): JSONContent {
  const blockIds = new Set<string>();
  const contentWithoutDuplicateIds = clearDuplicateBlockIds(content, blockIds);
  const generateId = options.generateId
    ? createUniqueBlockIdGenerator(options.generateId, blockIds)
    : undefined;

  return generateUniqueIds(
    contentWithoutDuplicateIds,
    createCoreExtensions(generateId),
  );
}

function clearDuplicateBlockIds(
  content: JSONContent,
  blockIds: Set<string>,
): JSONContent {
  function visit(node: JSONContent): JSONContent {
    const children = node.content?.map(visit);
    const id = node.attrs?.id;
    let attrs = node.attrs;

    if (blockNodeTypes.includes(node.type ?? '') && typeof id === 'string') {
      if (blockIds.has(id)) {
        attrs = { ...attrs, id: null };
      } else {
        blockIds.add(id);
      }
    }

    return {
      ...node,
      ...(attrs !== node.attrs ? { attrs } : {}),
      ...(children ? { content: children } : {}),
    };
  }

  return visit(content);
}

function createUniqueBlockIdGenerator(
  generateId: BlockIdGenerator,
  blockIds: Set<string>,
): BlockIdGenerator {
  return () => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const id = generateId();

      if (!blockIds.has(id)) {
        blockIds.add(id);
        return id;
      }
    }

    throw new Error('Block ID generator did not return a unique ID.');
  };
}

export function createSchemaRegistry(
  additionalExtensions: Extensions = [],
): RicherSchemaRegistry {
  const extensions = [...coreExtensions, ...additionalExtensions];
  const extensionNames = new Set(coreExtensionNames);

  for (const extension of additionalExtensions) {
    if (extensionNames.has(extension.name)) {
      throw new Error(`Duplicate extension name: ${extension.name}`);
    }

    extensionNames.add(extension.name);
  }

  return {
    extensions,
    schema: getSchema(extensions),
  };
}

export const richerSchemaRegistry = createSchemaRegistry();
