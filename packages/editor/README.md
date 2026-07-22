# @bizjs/richer-editor

Richer Editor 的可发布核心包。项目处于 `0.1.0` 开发阶段，公开 API 尚未稳定。

## Schema

`richerSchemaRegistry` 提供由 Tiptap `Document`、`Paragraph`、`Text` 和 `UniqueID` 组成的官方最小 schema。

需要增加自定义 Tiptap extension 时，使用 `createSchemaRegistry(additionalExtensions)` 创建独立 registry。extension 名称与核心节点或其他扩展重复时会直接报错。

## 块节点 ID

官方 schema 中的段落持久化稳定 `id`。默认生成 UUID v4；新建和拆分生成新 ID，移动和合并保留原块 ID，复制或粘贴产生的新块使用新 ID。

导入 JSON 前可调用 `normalizeBlockIds(content, { generateId })`，为缺失 ID 的块补齐 ID，并修复重复或生成冲突。`generateId` 可省略，测试或宿主需要自定义格式时再传入。
