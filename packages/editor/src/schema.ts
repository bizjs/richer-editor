import { getSchema, type Extensions } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import type { Schema } from '@tiptap/pm/model';

export interface RicherSchemaRegistry {
  extensions: Extensions;
  schema: Schema;
}

const extensions: Extensions = [Document, Paragraph, Text];

export const richerSchemaRegistry: RicherSchemaRegistry = {
  extensions,
  schema: getSchema(extensions),
};
