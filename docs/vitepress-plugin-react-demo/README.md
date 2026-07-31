# vitepress-plugin-react-demo

在 VitePress 中渲染 React Demo，并展示对应源码。

## 当前仓库内开发

本项目是一个独立包，不属于上层 pnpm workspace。首次安装依赖时，需要在仓库根目录执行：

```bash
cd docs/vitepress-plugin-react-demo
pnpm install --ignore-workspace
```

该命令会在插件目录内安装依赖并维护独立的 `pnpm-lock.yaml`，不会修改上层 workspace 的锁文件。

安装完成后，可以运行：

```bash
pnpm test
pnpm typecheck
pnpm build
```

项目迁出当前仓库后，不再需要 `--ignore-workspace`，直接执行 `pnpm install` 即可。

## VitePress 配置

```ts
import { defineConfig } from 'vitepress';
import { reactDemo } from 'vitepress-plugin-react-demo';

export default defineConfig({
  extends: reactDemo(),
});
```

## VitePress 主题

```ts
import DefaultTheme from 'vitepress/theme';
import { withReactDemo } from 'vitepress-plugin-react-demo/client';
import 'vitepress-plugin-react-demo/style.css';

export default withReactDemo(DefaultTheme);
```
