import { getSchema, type Extensions } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import type { Schema } from '@tiptap/pm/model';

export interface RicherSchemaRegistry {
  extensions: Extensions;
  schema: Schema;
}

const coreExtensions: Extensions = [Document, Paragraph, Text];

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
