---
layout: home

hero:
  name: Richer Editor
  text: Rich-text editing for React
  tagline: Schema-first documents, practical editing tools, and a typed React API.
---

<script setup lang="ts">
import BasicEditorDemo from './demos/basic-editor';
import basicEditorSource from './demos/basic-editor.tsx?raw';
</script>

## Interactive demo

<ReactDemo
  :component="BasicEditorDemo"
  :source="basicEditorSource"
  title="Richer Editor"
/>
