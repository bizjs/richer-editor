# Richer Editor

A modern, extensible rich-text editor for React, built on Tiptap.

Richer Editor 当前处于早期开发阶段。Playground 使用 Vite，库产物使用 tsdown 构建。

## 环境要求

- Node.js 22.18 或更高的 22.x，或 Node.js 24.11 及以上版本
- pnpm 11.9.0

## 开始开发

```bash
pnpm install
pnpm dev
```

`pnpm dev` 会先构建 `@bizjs/richer-editor`，再同时启动库的监听构建和 Vite Playground。

## 质量检查

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
pnpm test:ssr
pnpm check
```

- `build` 通过 tsdown 生成 ESM、类型、CSS、sourcemap，并用 publint 校验发布配置。
- `test:ssr` 验证构建产物可以在 Node 环境安全导入。
- `check` 运行当前全部非浏览器质量检查。

## 发布

项目使用 Changesets 管理 `@bizjs/richer-editor` 的版本和
`packages/editor/CHANGELOG.md`。Changelog 来自 changeset 中的发布说明，不从
Git commit message 自动生成，也不应手工维护。

### 添加 changeset

会影响已发布编辑器包的变更，在提交代码时运行：

```bash
pnpm changeset
```

根据兼容性选择版本级别：

- `patch`：兼容的缺陷修复。
- `minor`：兼容的新功能或公开能力。
- `major`：破坏公开 API、数据格式或使用方式的变更。

发布说明应描述使用者可观察到的变化，不记录内部任务编号、测试补充或实现过程。
只修改测试、工具、文档或私有 Playground 时通常不需要 changeset，除非它同时改变
发布包的行为。

提交前可以查看当前发布计划：

```bash
pnpm changeset status --verbose
```

### 自动发布流程

1. 将包含 changeset 的功能变更合并到 `main`。
2. `Release` workflow 运行 `pnpm check`，并创建或更新
   `chore: release packages` PR。
3. 审阅该 PR 中的版本号和 `packages/editor/CHANGELOG.md`。
4. 合并发布 PR 后，workflow 重新检查和构建包，然后发布到 npm。
5. Changesets 创建对应 Git tag 和 GitHub Release。

`pnpm version-packages` 和 `pnpm release` 主要供 Release workflow 使用。正常发布
不要在功能分支手工修改版本号或直接执行 `npm publish`。

### 首次发布和 npm Trusted Publisher

npm 包首次发布前尚不能配置 Trusted Publisher。首次发布需要在 GitHub 仓库中添加
临时的 `NPM_TOKEN` Secret，让 Release workflow 创建
`@bizjs/richer-editor@0.1.0`。

首次发布成功后，在 npm 的 `@bizjs/richer-editor` 包设置中添加 GitHub Actions
Trusted Publisher：

- Organization or user：`bizjs`
- Repository：`richer-editor`
- Workflow filename：`release.yml`
- Environment：留空
- Allowed action：`npm publish`

配置完成并验证下一次发布成功后，删除 GitHub 中的 `NPM_TOKEN`。后续发布通过
GitHub OIDC 获取短期凭据，不再依赖长期 npm token。

## Workspace

```text
apps/playground       React/Vite 交互验证应用
packages/editor       @bizjs/richer-editor 核心包
```

编辑器包不应依赖 Playground。Playground 和测试消费者必须通过包的公开 exports 使用编辑器。
