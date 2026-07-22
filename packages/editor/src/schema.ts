import { getSchema, type Extensions, type JSONContent } from '@tiptap/core';
import { Highlight } from '@tiptap/extension-highlight';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TableKit } from '@tiptap/extension-table';
import { TextAlign } from '@tiptap/extension-text-align';
import { Color, TextStyle } from '@tiptap/extension-text-style';
import { generateUniqueIds, UniqueID } from '@tiptap/extension-unique-id';
import type { Schema } from '@tiptap/pm/model';
import StarterKit from '@tiptap/starter-kit';

export interface RicherSchemaRegistry {
  extensions: Extensions;
  schema: Schema;
}

export type BlockIdGenerator = () => string;

export interface NormalizeBlockIdsOptions {
  generateId?: BlockIdGenerator;
}

const blockNodeTypes = [
  'blockquote',
  'bulletList',
  'codeBlock',
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
    StarterKit.configure({ trailingNode: false }),
    TaskList,
    TaskItem.configure({ nested: true }),
    TableKit.configure({ table: { resizable: true } }),
    Highlight.configure({ multicolor: true }),
    TextStyle,
    Color,
    Subscript,
    Superscript,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
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
