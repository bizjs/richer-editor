<script setup lang="ts">
import { createElement, type ComponentType } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  watch,
} from 'vue';

type SourceLanguage = 'js' | 'jsx' | 'ts' | 'tsx';

async function createSourceHighlighter() {
  const [
    { createHighlighterCore },
    { createJavaScriptRegexEngine },
    githubLight,
    githubDark,
    javascript,
    jsx,
    typescript,
    tsx,
  ] = await Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
    import('shiki/themes/github-light.mjs'),
    import('shiki/themes/github-dark.mjs'),
    import('shiki/langs/js.mjs'),
    import('shiki/langs/jsx.mjs'),
    import('shiki/langs/ts.mjs'),
    import('shiki/langs/tsx.mjs'),
  ]);

  return createHighlighterCore({
    themes: [githubLight.default, githubDark.default],
    langs: [javascript.default, jsx.default, typescript.default, tsx.default],
    engine: createJavaScriptRegexEngine(),
  });
}

let sourceHighlighterPromise:
  ReturnType<typeof createSourceHighlighter> | undefined;

function getSourceHighlighter() {
  sourceHighlighterPromise ??= createSourceHighlighter();
  return sourceHighlighterPromise;
}

const props = withDefaults(
  defineProps<{
    component: ComponentType;
    language?: SourceLanguage;
    source?: string;
    title?: string;
  }>(),
  {
    language: 'tsx',
  },
);

type DemoTab = 'preview' | 'source';

const activeTab = ref<DemoTab>('preview');
const copyMessage = ref('');
const highlightedSource = ref('');
const mountElement = ref<HTMLElement | null>(null);
const previewTabElement = ref<HTMLButtonElement | null>(null);
const sourceTabElement = ref<HTMLButtonElement | null>(null);
const instanceId = useId();
const hasSource = computed(() => props.source !== undefined);
const previewTabId = `vp-react-demo-preview-tab-${instanceId}`;
const previewPanelId = `vp-react-demo-preview-panel-${instanceId}`;
const sourceTabId = `vp-react-demo-source-tab-${instanceId}`;
const sourcePanelId = `vp-react-demo-source-panel-${instanceId}`;
let reactRoot: Root | undefined;
let highlightRequest = 0;

async function highlightSource() {
  const source = props.source;

  if (source === undefined) {
    highlightedSource.value = '';
    return;
  }

  const request = ++highlightRequest;

  try {
    const highlighter = await getSourceHighlighter();
    const html = highlighter.codeToHtml(source, {
      lang: props.language,
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: false,
    });

    if (request === highlightRequest && source === props.source) {
      highlightedSource.value = html;
    }
  } catch {
    if (request === highlightRequest) {
      highlightedSource.value = '';
    }
  }
}

function activateTab(tab: DemoTab, moveFocus = false) {
  activeTab.value = tab;

  if (moveFocus) {
    void nextTick(() => {
      const target =
        tab === 'preview' ? previewTabElement.value : sourceTabElement.value;
      target?.focus();
    });
  }
}

function handleTabKeydown(event: KeyboardEvent) {
  let target: DemoTab | undefined;

  switch (event.key) {
    case 'ArrowLeft':
    case 'Home':
      target = 'preview';
      break;
    case 'ArrowRight':
    case 'End':
      target = 'source';
      break;
  }

  if (target) {
    event.preventDefault();
    activateTab(target, true);
  }
}

async function copySource() {
  if (props.source === undefined) {
    return;
  }

  try {
    await navigator.clipboard.writeText(props.source);
    copyMessage.value = 'Copied';
  } catch {
    copyMessage.value = 'Copy failed';
  }
}

function renderReactComponent() {
  reactRoot?.render(createElement(props.component));
}

onMounted(() => {
  if (!mountElement.value) {
    return;
  }

  reactRoot = createRoot(mountElement.value);
  renderReactComponent();
});

watch(() => props.component, renderReactComponent);
watch(hasSource, (sourceIsAvailable) => {
  if (!sourceIsAvailable) {
    activeTab.value = 'preview';
  }
});
watch(activeTab, (tab) => {
  if (tab === 'source' && !highlightedSource.value) {
    void highlightSource();
  }
});
watch(
  () => [props.source, props.language] as const,
  () => {
    copyMessage.value = '';
    highlightedSource.value = '';

    if (activeTab.value === 'source') {
      void highlightSource();
    }
  },
);

onBeforeUnmount(() => {
  highlightRequest += 1;
  reactRoot?.unmount();
  reactRoot = undefined;
});
</script>

<template>
  <section class="vp-react-demo">
    <header v-if="title || hasSource" class="vp-react-demo__header">
      <div v-if="title" class="vp-react-demo__title">{{ title }}</div>

      <div
        v-if="hasSource"
        class="vp-react-demo__tabs"
        role="tablist"
        aria-label="Demo views"
        @keydown="handleTabKeydown"
      >
        <button
          ref="previewTabElement"
          :id="previewTabId"
          type="button"
          class="vp-react-demo__tab"
          role="tab"
          :aria-controls="previewPanelId"
          :aria-selected="activeTab === 'preview'"
          :tabindex="activeTab === 'preview' ? 0 : -1"
          @click="activateTab('preview')"
        >
          Preview
        </button>
        <button
          ref="sourceTabElement"
          :id="sourceTabId"
          type="button"
          class="vp-react-demo__tab"
          role="tab"
          :aria-controls="sourcePanelId"
          :aria-selected="activeTab === 'source'"
          :tabindex="activeTab === 'source' ? 0 : -1"
          @click="activateTab('source')"
        >
          Source
        </button>
      </div>
    </header>

    <div
      :id="previewPanelId"
      v-show="activeTab === 'preview'"
      class="vp-react-demo__panel vp-react-demo__preview"
      :role="hasSource ? 'tabpanel' : undefined"
      :aria-labelledby="hasSource ? previewTabId : undefined"
    >
      <div ref="mountElement" class="vp-react-demo__mount" />
    </div>

    <div
      v-if="hasSource"
      :id="sourcePanelId"
      v-show="activeTab === 'source'"
      class="vp-react-demo__panel vp-react-demo__source"
      role="tabpanel"
      :aria-labelledby="sourceTabId"
    >
      <div class="vp-react-demo__source-toolbar">
        <button
          type="button"
          class="vp-react-demo__copy"
          aria-label="Copy source"
          @click="copySource"
        >
          Copy
        </button>
        <span
          class="vp-react-demo__copy-status"
          role="status"
          aria-live="polite"
        >
          {{ copyMessage }}
        </span>
      </div>
      <div
        v-if="highlightedSource"
        class="vp-react-demo__highlighted-source"
        v-html="highlightedSource"
      />
      <pre
        v-else
        class="vp-react-demo__source-fallback"
      ><code>{{ source }}</code></pre>
    </div>
  </section>
</template>
