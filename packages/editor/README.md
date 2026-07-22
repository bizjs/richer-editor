# @bizjs/richer-editor

Richer Editor 的可发布核心包。项目处于 `0.1.0` 开发阶段，公开 API 尚未稳定。

## Schema

`richerSchemaRegistry` 使用 Tiptap StarterKit，并默认关闭 `TrailingNode`。当前包含标题、引用、代码块、分隔线、普通列表、可嵌套任务列表、链接，以及粗体、斜体、下划线、删除线和行内代码等基础格式。

需要增加自定义 Tiptap extension 时，使用 `createSchemaRegistry(additionalExtensions)` 创建独立 registry。extension 名称与核心节点或其他扩展重复时会直接报错。

## 块节点 ID

官方 schema 中的段落、标题、引用、代码块、分隔线、普通列表和任务列表节点持久化稳定 `id`。默认生成 UUID v4；新建和拆分生成新 ID，移动和合并保留原块 ID，复制或粘贴产生的新块使用新 ID。

导入 JSON 前可调用 `normalizeBlockIds(content, { generateId })`，为缺失 ID 的块补齐 ID，并修复重复或生成冲突。`generateId` 可省略，测试或宿主需要自定义格式时再传入。

## React 编辑器

`RicherEditor` 支持 `document + onChange` 受控模式和 `defaultDocument` 非受控模式。`onChange` 返回包含最新内容的完整 `RicherDocument`。

组件挂载后不得在受控与非受控模式之间切换。外部受控更新不会再次触发 `onChange`，不会进入撤销历史，并在新文档允许时保持原选区位置。
