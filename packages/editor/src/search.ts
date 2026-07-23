import { Extension, type Command } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface SearchMatch {
  from: number;
  to: number;
}

export interface SearchState {
  activeIndex: number;
  decorations: DecorationSet;
  matches: SearchMatch[];
  term: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    search: {
      clearSearch: () => ReturnType;
      findNext: () => ReturnType;
      findPrevious: () => ReturnType;
      replaceAll: (replacement: string) => ReturnType;
      replaceCurrent: (replacement: string) => ReturnType;
      setSearchTerm: (term: string) => ReturnType;
    };
  }
}

export const searchPluginKey = new PluginKey<SearchState>('search');

function findMatches(document: ProseMirrorNode, term: string): SearchMatch[] {
  if (!term) {
    return [];
  }

  const matches: SearchMatch[] = [];
  const query = term.toLocaleLowerCase();

  document.descendants((node, position) => {
    if (!node.isTextblock) {
      return;
    }

    const text = node
      .textBetween(0, node.content.size, '', '\ufffc')
      .toLocaleLowerCase();
    let index = text.indexOf(query);

    while (index !== -1) {
      matches.push({
        from: position + index + 1,
        to: position + index + query.length + 1,
      });
      index = text.indexOf(query, index + query.length);
    }

    return false;
  });

  return matches;
}

function createSearchState(
  document: ProseMirrorNode,
  term: string,
  activeIndex = 0,
): SearchState {
  const matches = findMatches(document, term);
  const nextActiveIndex =
    matches.length === 0
      ? 0
      : Math.min(Math.max(activeIndex, 0), matches.length - 1);
  const decorations = DecorationSet.create(
    document,
    matches.map(({ from, to }, index) =>
      Decoration.inline(from, to, {
        class:
          index === nextActiveIndex
            ? 'richer-editor__search-match richer-editor__search-match--active'
            : 'richer-editor__search-match',
      }),
    ),
  );

  return {
    activeIndex: nextActiveIndex,
    decorations,
    matches,
    term,
  };
}

function moveSearchSelection(offset: number): Command {
  return ({ state, dispatch }) => {
    const searchState = searchPluginKey.getState(state);

    if (!searchState || searchState.matches.length === 0) {
      return false;
    }

    const count = searchState.matches.length;
    const activeIndex = (searchState.activeIndex + offset + count) % count;
    const match = searchState.matches[activeIndex];

    if (dispatch && match) {
      dispatch(
        state.tr
          .setMeta(searchPluginKey, { activeIndex })
          .setSelection(TextSelection.create(state.doc, match.from, match.to))
          .scrollIntoView(),
      );
    }

    return true;
  };
}

export const Search = Extension.create({
  name: 'search',

  addCommands() {
    return {
      clearSearch:
        () =>
        ({ state, dispatch }) => {
          dispatch?.(state.tr.setMeta(searchPluginKey, { term: '' }));
          return true;
        },
      findNext: () => moveSearchSelection(1),
      findPrevious: () => moveSearchSelection(-1),
      replaceAll:
        (replacement) =>
        ({ state, dispatch }) => {
          const searchState = searchPluginKey.getState(state);

          if (!searchState || searchState.matches.length === 0) {
            return false;
          }

          if (dispatch) {
            const transaction = state.tr;

            for (const match of [...searchState.matches].reverse()) {
              transaction.insertText(replacement, match.from, match.to);
            }

            dispatch(transaction);
          }

          return true;
        },
      replaceCurrent:
        (replacement) =>
        ({ state, dispatch }) => {
          const searchState = searchPluginKey.getState(state);
          const match = searchState?.matches[searchState.activeIndex];

          if (!match) {
            return false;
          }

          dispatch?.(state.tr.insertText(replacement, match.from, match.to));
          return true;
        },
      setSearchTerm:
        (term) =>
        ({ state, dispatch }) => {
          dispatch?.(state.tr.setMeta(searchPluginKey, { term }));
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<SearchState>({
        key: searchPluginKey,
        props: {
          decorations: (state) =>
            searchPluginKey.getState(state)?.decorations ?? null,
        },
        state: {
          apply: (transaction, value, _oldState, newState) => {
            const metadata = transaction.getMeta(searchPluginKey) as
              { activeIndex?: number; term?: string } | undefined;

            if (metadata?.term !== undefined) {
              return createSearchState(newState.doc, metadata.term);
            }

            if (metadata?.activeIndex !== undefined) {
              return createSearchState(
                newState.doc,
                value.term,
                metadata.activeIndex,
              );
            }

            if (transaction.docChanged && value.term) {
              return createSearchState(
                newState.doc,
                value.term,
                value.activeIndex,
              );
            }

            return value;
          },
          init: (_configuration, state) => createSearchState(state.doc, ''),
        },
      }),
    ];
  },
});
