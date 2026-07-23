import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

function createTestRect(): DOMRect {
  return {
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    toJSON: () => ({}),
    top: 0,
    width: 0,
    x: 0,
    y: 0,
  };
}

function createTestRectList(): DOMRectList {
  return {
    [Symbol.iterator]: () => new Array<DOMRect>()[Symbol.iterator](),
    item: () => null,
    length: 0,
  };
}

Range.prototype.getBoundingClientRect = () => createTestRect();
Range.prototype.getClientRects = () => createTestRectList();

afterEach(cleanup);
