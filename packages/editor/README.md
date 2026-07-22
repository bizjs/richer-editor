# @bizjs/richer-editor

Richer Editor 的可发布核心包。项目处于 `0.1.0` 开发阶段，公开 API 尚未稳定。

## Schema

`richerSchemaRegistry` 使用 Tiptap StarterKit，并默认关闭 `TrailingNode`。当前包含标题、引用、代码块、分隔线、普通列表、可嵌套任务列表、Details、支持列宽调整的表格、链接，以及粗体、斜体、下划线、删除线、行内代码、多色高亮、文字颜色、上标、下标和文本对齐等格式。

文字颜色只注册 `TextStyle` 和 `Color`。核心 schema 不包含字体、字号、行高或任意内联样式，避免文档绕过统一排版约束。

文本对齐只作用于标题和段落，支持左对齐、居中、右对齐和两端对齐。未设置时规范化为 `textAlign: null`。

Details 的容器、摘要和内容均持久化稳定 `id`。展开状态属于编辑界面状态，不写入 RicherDocument；切换按钮使用摘要生成可访问名称。

Typography 输入规则默认启用，可在编辑时将 `--`、`...`、`->` 等常见字符组合转换为对应的排版字符。转换结果以普通文本持久化，不增加额外的 JSON 节点或 mark。

需要增加自定义 Tiptap extension 时，使用 `createSchemaRegistry(additionalExtensions)` 创建独立 registry。extension 名称与核心节点或其他扩展重复时会直接报错。

## 块节点 ID

官方 schema 中的段落、标题、引用、代码块、分隔线、列表及表格节点持久化稳定 `id`。默认生成 UUID v4；新建和拆分生成新 ID，移动和合并保留原块 ID，复制或粘贴产生的新块使用新 ID。

导入 JSON 前可调用 `normalizeBlockIds(content, { generateId })`，为缺失 ID 的块补齐 ID，并修复重复或生成冲突。`generateId` 可省略，测试或宿主需要自定义格式时再传入。

## React 编辑器

`RicherEditor` 支持 `document + onChange` 受控模式和 `defaultDocument` 非受控模式。`onChange` 返回包含最新内容的完整 `RicherDocument`。

组件挂载后不得在受控与非受控模式之间切换。外部受控更新不会再次触发 `onChange`，不会进入撤销历史，并在新文档允许时保持原选区位置。

`placeholder` 用于配置空白写作提示，默认为 `Start writing…`。提示只在空的可编辑文档中显示，属性更新不会重建编辑器；占位文案属于界面装饰，不进入 `RicherDocument`。
