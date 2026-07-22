import { getSchema, type Extensions, type JSONContent } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { generateUniqueIds, UniqueID } from '@tiptap/extension-unique-id';
import type { Schema } from '@tiptap/pm/model';

export interface RicherSchemaRegistry {
  extensions: Extensions;
  schema: Schema;
}

export type BlockIdGenerator = () => string;

export interface NormalizeBlockIdsOptions {
  generateId?: BlockIdGenerator;
}

const blockNodeTypes = ['paragraph'];

function createCoreExtensions(generateId?: BlockIdGenerator): Extensions {
  const uniqueId = UniqueID.configure({
    types: blockNodeTypes,
    ...(generateId ? { generateID: generateId } : {}),
  });

  return [Document, Paragraph, Text, uniqueId];
}

const coreExtensions = createCoreExtensions();

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
  const extensionNames = new Set<string>();

  for (const extension of extensions) {
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
