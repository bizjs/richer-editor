import type { JSONContent } from '@tiptap/core';

export const CURRENT_SCHEMA_VERSION = 1;

export type RicherExtensionVersions = Record<string, number>;

export interface RicherDocument {
  schemaVersion: number;
  extensions: RicherExtensionVersions;
  content: JSONContent;
}

export interface InvalidDocumentError {
  code: 'INVALID_DOCUMENT';
  message: string;
}

export interface UnsupportedSchemaVersionError {
  code: 'UNSUPPORTED_SCHEMA_VERSION';
  message: string;
  schemaVersion: number;
  supportedVersion: number;
}

export type RicherDocumentError =
  | InvalidDocumentError
  | UnsupportedSchemaVersionError;

export type RicherDocumentValidationResult =
  | { ok: true; document: RicherDocument }
  | { ok: false; error: RicherDocumentError };

export type RicherDocumentMigrationResult =
  | { ok: true; document: RicherDocument; migrated: boolean }
  | { ok: false; error: RicherDocumentError };

export function createDocument(
  content: JSONContent = { type: 'doc', content: [] },
): RicherDocument {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    extensions: {},
    content,
  };
}

export function extractContent(document: RicherDocument): JSONContent {
  return document.content;
}

export function validateDocument(
  input: unknown,
): RicherDocumentValidationResult {
  if (!isRicherDocument(input)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_DOCUMENT',
        message: 'The value is not a valid Richer document envelope.',
      },
    };
  }

  if (input.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_SCHEMA_VERSION',
        message: `Schema version ${input.schemaVersion} is newer than supported version ${CURRENT_SCHEMA_VERSION}.`,
        schemaVersion: input.schemaVersion,
        supportedVersion: CURRENT_SCHEMA_VERSION,
      },
    };
  }

  return { ok: true, document: input };
}

export function migrateDocument(
  input: unknown,
): RicherDocumentMigrationResult {
  const validation = validateDocument(input);

  if (!validation.ok) {
    return validation;
  }

  const document = validation.document;

  if (document.schemaVersion === CURRENT_SCHEMA_VERSION) {
    return { ok: true, document, migrated: false };
  }

  return {
    ok: true,
    migrated: true,
    document: {
      ...document,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    },
  };
}

function isRicherDocument(input: unknown): input is RicherDocument {
  if (!isRecord(input)) {
    return false;
  }

  return (
    typeof input.schemaVersion === 'number' &&
    Number.isInteger(input.schemaVersion) &&
    input.schemaVersion >= 0 &&
    isExtensionVersions(input.extensions) &&
    isRecord(input.content)
  );
}

function isExtensionVersions(input: unknown): input is RicherExtensionVersions {
  if (!isRecord(input)) {
    return false;
  }

  return Object.values(input).every(
    (version) =>
      typeof version === 'number' &&
      Number.isInteger(version) &&
      version >= 0,
  );
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}
