# @bizjs/richer-editor

Richer Editor 的可发布核心包。项目处于 `0.1.0` 开发阶段，公开 API 尚未稳定。

## Schema

`richerSchemaRegistry` 提供由 Tiptap `Document`、`Paragraph` 和 `Text` 组成的官方最小 schema。

需要增加自定义 Tiptap extension 时，使用 `createSchemaRegistry(additionalExtensions)` 创建独立 registry。extension 名称与核心节点或其他扩展重复时会直接报错。
