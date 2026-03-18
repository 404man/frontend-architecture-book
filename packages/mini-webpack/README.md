# mini-webpack

`mini-webpack` 是“构建工具章节”的可运行示例实现，目标是用最小代码展示 bundler 的核心链路与扩展机制。

## 支持能力

- 入口读取与依赖递归解析（`import ... from ...`）
- 模块图构建与单文件 bundle 输出
- 简易 loader 机制（`module.rules[].use`）
- 简易 plugin 机制（`run` / `emit` / `done` 生命周期）

## 快速运行

在仓库根目录执行：

```bash
pnpm --filter @book/mini-webpack run demo
```

或在 `packages/mini-webpack` 下执行：

```bash
pnpm run build:example
pnpm run run:example
```

预期输出包含：

- plugin 生命周期日志
- `mini-webpack: build-tools chapter demo`

## 目录说明

- `index.js`：mini-webpack 编译器与 CLI 入口
- `examples/src`：示例源码
- `examples/mini-webpack.config.js`：示例构建配置
- `examples/dist/bundle.js`：构建产物

## 能力边界

当前实现用于教学，不追求完整 Webpack 兼容性，暂不支持：

- 非相对路径依赖解析（如 npm 包解析）
- source map、代码分包、watch 模式
- 完整 ESM 语法覆盖（仅覆盖章节示例所需语法）
