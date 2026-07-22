import './styles.css';

export {
  CURRENT_SCHEMA_VERSION,
  createDocument,
  extractContent,
  migrateDocument,
  validateDocument,
  type InvalidDocumentError,
  type RicherDocument,
  type RicherDocumentError,
  type RicherDocumentMigrationResult,
  type RicherDocumentValidationResult,
  type RicherExtensionVersions,
  type UnsupportedSchemaVersionError,
} from './document';
export { RicherEditor, type RicherEditorProps } from './RicherEditor';
export {
  richerSchemaRegistry,
  type RicherSchemaRegistry,
} from './schema';
export type { JSONContent } from '@tiptap/core';
