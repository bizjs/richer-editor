import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, type EditorState } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

interface FocusModeState {
  decorations: DecorationSet;
  enabled: boolean;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    focusMode: {
      setFocusMode: (enabled: boolean) => ReturnType;
    };
  }
}

const focusModePluginKey = new PluginKey<FocusModeState>('focusMode');

function createFocusModeDecorations(state: EditorState): DecorationSet {
  const decorations: Decoration[] = [];
  const { from, to } = state.selection;

  state.doc.forEach((node, offset) => {
    const nodeEnd = offset + node.nodeSize;
    const selectionTouchesNode = from <= nodeEnd && to >= offset;

    if (!selectionTouchesNode) {
      decorations.push(
        Decoration.node(offset, nodeEnd, {
          class: 'richer-editor__focus-dim',
        }),
      );
    }
  });

  return DecorationSet.create(state.doc, decorations);
}

export const FocusMode = Extension.create({
  name: 'focusMode',

  addCommands() {
    return {
      setFocusMode:
        (enabled) =>
        ({ state, dispatch }) => {
          dispatch?.(state.tr.setMeta(focusModePluginKey, { enabled }));
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<FocusModeState>({
        key: focusModePluginKey,
        props: {
          decorations: (state) =>
            focusModePluginKey.getState(state)?.decorations ?? null,
        },
        state: {
          apply: (transaction, value, _oldState, newState) => {
            const metadata = transaction.getMeta(focusModePluginKey) as
              { enabled: boolean } | undefined;
            const enabled = metadata?.enabled ?? value.enabled;

            if (!enabled) {
              return {
                decorations: DecorationSet.empty,
                enabled,
              };
            }

            if (
              !metadata &&
              !transaction.docChanged &&
              !transaction.selectionSet
            ) {
              return value;
            }

            return {
              decorations: createFocusModeDecorations(newState),
              enabled,
            };
          },
          init: () => ({
            decorations: DecorationSet.empty,
            enabled: false,
          }),
        },
      }),
    ];
  },
});
