import {
  NodeViewContent,
  NodeViewWrapper,
  type ReactNodeViewProps,
} from '@tiptap/react';
import { useContext } from 'react';

import { CALLOUT_VARIANTS, type CalloutVariant } from './callout-variants';
import { RicherEditorEditableContext } from './editor-context';

const VARIANT_SYMBOLS: Record<CalloutVariant, string> = {
  danger: '×',
  info: 'i',
  tip: '✦',
  warn: '!',
};

export function CalloutView({
  editor,
  node,
  updateAttributes,
}: ReactNodeViewProps) {
  const variant = node.attrs.variant as CalloutVariant;
  const blockId = typeof node.attrs.id === 'string' ? node.attrs.id : undefined;
  const editorEditable = useContext(RicherEditorEditableContext);
  const editable = editorEditable ?? editor.isEditable;

  function cycleVariant(): void {
    const currentIndex = CALLOUT_VARIANTS.indexOf(variant);
    const nextVariant =
      CALLOUT_VARIANTS[(currentIndex + 1) % CALLOUT_VARIANTS.length] ?? 'info';

    updateAttributes({ variant: nextVariant });
  }

  return (
    <NodeViewWrapper
      data-id={blockId}
      data-type="callout"
      data-variant={variant}
    >
      <button
        aria-label={`Callout style: ${variant}. Activate to change`}
        className="richer-editor__callout-style"
        contentEditable={false}
        disabled={!editable}
        onClick={cycleVariant}
        type="button"
      >
        <span aria-hidden="true">{VARIANT_SYMBOLS[variant]}</span>
      </button>
      <NodeViewContent className="richer-editor__callout-content" />
    </NodeViewWrapper>
  );
}
