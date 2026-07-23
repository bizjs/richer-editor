# @bizjs/richer-editor

Richer Editor 的可发布核心包。项目处于 `0.1.0` 开发阶段，公开 API 尚未稳定。

## Schema

`richerSchemaRegistry` 使用 Tiptap StarterKit，并默认关闭 `TrailingNode`。当前包含标题、引用、Callout、带语法高亮的代码块、分隔线、普通列表、可嵌套任务列表、Details、支持列宽调整的表格、链接，以及粗体、斜体、下划线、删除线、行内代码、多色高亮、文字颜色、上标、下标和文本对齐等格式。

代码块使用 CodeBlockLowlight 和 lowlight `common` 语言集合。已注册语言按声明的 `language` 高亮，未知或未声明语言使用自动检测；原始语言属性与代码文本仍是 JSON 的权威内容。

文字颜色只注册 `TextStyle` 和 `Color`。核心 schema 不包含字体、字号、行高或任意内联样式，避免文档绕过统一排版约束。

文本对齐只作用于标题和段落，支持左对齐、居中、右对齐和两端对齐。未设置时规范化为 `textAlign: null`。

Details 的容器、摘要和内容均持久化稳定 `id`。展开状态属于编辑界面状态，不写入 RicherDocument；切换按钮使用摘要生成可访问名称。

Callout 使用 `info`、`tip`、`warn`、`danger` 四种变体，未声明时默认为 `info`。外层 Callout 和内部块均持久化稳定 `id`；编辑状态下可通过信息块左侧的类型按钮循环切换变体，只读状态下该按钮禁用。`CALLOUT_VARIANTS` 和 `CalloutVariant` 可用于宿主侧约束变体值。

Typography 输入规则默认启用，可在编辑时将 `--`、`...`、`->` 等常见字符组合转换为对应的排版字符。转换结果以普通文本持久化，不增加额外的 JSON 节点或 mark。

需要增加自定义 Tiptap extension 时，使用 `createSchemaRegistry(additionalExtensions)` 创建独立 registry。extension 名称与核心节点或其他扩展重复时会直接报错。

## 块节点 ID

官方 schema 中的段落、标题、引用、代码块、分隔线、列表及表格节点持久化稳定 `id`。默认生成 UUID v4；新建和拆分生成新 ID，移动和合并保留原块 ID，复制或粘贴产生的新块使用新 ID。

导入 JSON 前可调用 `normalizeBlockIds(content, { generateId })`，为缺失 ID 的块补齐 ID，并修复重复或生成冲突。`generateId` 可省略，测试或宿主需要自定义格式时再传入。

## React 编辑器

`RicherEditor` 支持 `document + onChange` 受控模式和 `defaultDocument` 非受控模式。`onChange` 返回包含最新内容的完整 `RicherDocument`。

组件挂载后不得在受控与非受控模式之间切换。外部受控更新不会再次触发 `onChange`，不会进入撤销历史，并在新文档允许时保持原选区位置。

`placeholder` 用于配置空白写作提示，默认为 `Start writing…`。提示只在空的可编辑文档中显示，属性更新不会重建编辑器；占位文案属于界面装饰，不进入 `RicherDocument`。

`onCharacterCountChange` 在编辑器创建、本地内容编辑和受控文档替换后报告 `{ characters, words }`。计数使用 Tiptap CharacterCount 的默认文本模式，不设置输入上限，也不改变 `RicherDocument`。

通过 `features={{ toolbar: true }}` 启用固定工具栏。当前提供粗体、斜体、下划线、删除线、行内代码、清除行内格式、二级标题、无序列表、有序列表、任务列表、引用、Callout 和代码块；切换按钮使用 `aria-pressed` 表示当前状态，只读模式下所有工具栏操作均禁用。

通过 `features={{ bubbleMenu: true }}` 启用选区格式菜单。菜单只在可编辑器内存在非空文本选区时显示，提供粗体、斜体、下划线和行内代码；失焦或切换到只读模式后自动隐藏。

通过 `features={{ slashMenu: true }}` 启用 Slash 菜单。在可编辑段落的开头或空白后输入 `/`，可按名称或中英文关键词过滤文本、标题、列表、表格、引用、代码块、Callout、Details 和分隔线命令。使用方向键选择、Enter 执行、Escape 关闭，也可直接点击选项；菜单状态和触发文本不会写入最终 RicherDocument。

通过 `features={{ search: true }}` 启用查找替换。编辑器聚焦时使用 `Cmd/Ctrl+F` 打开面板；匹配忽略大小写，可通过按钮、Enter 和 Shift+Enter 循环导航。可编辑模式支持替换当前和一次性替换全部，只读模式保留查找与导航但禁用替换。查询、当前匹配和高亮属于临时界面状态，只有替换结果通过 `onChange` 进入 RicherDocument。

通过 `features={{ focusMode: true }}` 启用专注模式开关。开启后，当前选区涉及的顶层块保持清晰，其他块弱化，并通过纵向留白将光标维持在适合连续写作的位置。滚动优先作用于最近的宿主滚动容器，并遵守系统的减少动态效果设置；模式状态和视觉装饰不会进入 `RicherDocument`。功能关闭、编辑器切换为只读或组件卸载时会清理临时状态。
