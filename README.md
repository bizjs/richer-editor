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

## Workspace

```text
apps/playground       React/Vite 交互验证应用
packages/editor       @bizjs/richer-editor 核心包
```

编辑器包不应依赖 Playground。Playground 和测试消费者必须通过包的公开 exports 使用编辑器。
