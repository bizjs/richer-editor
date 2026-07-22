import { describe, expect, it } from 'vitest';

import {
  createDocument,
  extractContent,
  migrateDocument,
  validateDocument,
  type JSONContent,
  type RicherDocument,
} from './index';

describe('createDocument', () => {
  it('creates an empty Richer document', () => {
    expect(createDocument()).toEqual({
      schemaVersion: 1,
      extensions: {},
      content: {
        type: 'doc',
        content: [],
      },
    });
  });
});

describe('extractContent', () => {
  it('returns the original Tiptap JSON without rewriting it', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello Richer Editor' }],
        },
      ],
    };

    expect(extractContent(createDocument(content))).toBe(content);
  });
});

describe('validateDocument', () => {
  it('accepts a current Richer document without rewriting it', () => {
    const document = createDocument();
    const result = validateDocument(document);

    expect(result).toEqual({
      ok: true,
      document,
    });

    if (!result.ok) {
      throw new Error('Expected validation to succeed.');
    }

    expect(result.document).toBe(document);
  });

  it('rejects a malformed document envelope', () => {
    expect(
      validateDocument({
        schemaVersion: 1,
        extensions: [],
        content: null,
      }),
    ).toMatchObject({
      ok: false,
      error: {
        code: 'INVALID_DOCUMENT',
      },
    });
  });

  it('rejects a future schema version', () => {
    expect(
      validateDocument({
        schemaVersion: 2,
        extensions: {},
        content: { type: 'doc', content: [] },
      }),
    ).toMatchObject({
      ok: false,
      error: {
        code: 'UNSUPPORTED_SCHEMA_VERSION',
        schemaVersion: 2,
        supportedVersion: 1,
      },
    });
  });
});

describe('migrateDocument', () => {
  it('migrates a version 0 document without rewriting its content', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [{ type: 'paragraph', attrs: { legacy: true } }],
    };
    const document: RicherDocument = {
      schemaVersion: 0,
      extensions: {},
      content,
    };

    const result = migrateDocument(document);

    expect(result).toMatchObject({
      ok: true,
      migrated: true,
      document: {
        schemaVersion: 1,
        extensions: {},
      },
    });

    if (!result.ok) {
      throw new Error('Expected migration to succeed.');
    }

    expect(result.document.content).toBe(content);
  });

  it('is idempotent for an already current document', () => {
    const document = createDocument();

    const first = migrateDocument(document);
    const second = migrateDocument(first.ok ? first.document : document);

    expect(first).toEqual({ ok: true, migrated: false, document });
    expect(second).toEqual({ ok: true, migrated: false, document });

    if (!second.ok) {
      throw new Error('Expected migration to succeed.');
    }

    expect(second.document).toBe(document);
  });
});
