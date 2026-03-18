# 第2章 构建工具原理与实践

## 2.1 构建工具在前端体系中的角色

构建工具并不只是“把代码打包”，它本质上是前端工程系统中的编译与交付中枢。它连接了开发阶段与运行阶段，承担三类关键职责：

- 语义转换：把高级语法、框架语法和样式语言转换为可运行产物；
- 依赖编排：分析模块关系，构建可加载、可缓存、可部署的资源图谱；
- 过程优化：在开发和生产两条链路上做不同策略优化。

因此，理解构建工具，不能停留在配置项层面，而要理解其背后的系统设计。

## 2.2 构建系统的抽象模型

无论是 Webpack、Vite，还是其他构建方案，都可以抽象为同一个处理流程。

### 2.2.1 输入：源代码与元信息

输入不仅是 `js/ts/css` 文件，还包含：

- 项目结构与入口定义；
- 配置文件与环境变量；
- 第三方依赖及其导出格式；
- 目标运行环境约束（浏览器版本、运行平台）。

### 2.2.2 处理：解析、转换、优化、输出

典型处理链路包括：

1. 解析依赖关系，构建模块图（Module Graph）；
2. 对不同类型资源执行转换（如 TypeScript、JSX、样式预处理）；
3. 基于目标环境进行优化（压缩、分割、摇树、缓存友好命名）；
4. 生成最终可部署产物与元数据。

### 2.2.3 输出：面向部署与运行的产物

输出不仅是静态文件集合，还包括：

- 资源映射关系（如入口与 chunk 对应关系）；
- 缓存策略所需命名信息（hash）；
- 调试与监控辅助信息（source map、构建统计信息）。

## 2.3 Webpack 的核心机制

Webpack 的设计哲学是“万物皆模块”，通过统一的模块图驱动整个构建流程。

### 2.3.1 loader：把非 JavaScript 资源转为模块

`loader` 负责资源转换，它让样式、图片、字体、Markdown 等资源进入同一条编译链。其本质是一个按顺序执行的转换管道：前一个 loader 的输出会成为后一个 loader 的输入。

从架构视角看，loader 的价值是把“多语言输入”统一为“可分析模块”，从而让依赖图谱完整闭环。

### 2.3.2 plugin：在构建生命周期扩展能力

`plugin` 通过监听编译生命周期钩子实现能力扩展，例如产物注入、资源清单生成、代码压缩、构建报告输出。它不聚焦单文件转换，而是作用于全局构建上下文。

可以将 loader 理解为“局部转换器”，plugin 理解为“全局编排器”。

### 2.3.3 module 与 chunk：从开发结构到运行结构

- `module` 是开发期最小依赖单元；
- `chunk` 是打包后运行期加载单元。

构建工具的关键职责之一，是把“开发期模块关系”映射为“运行期加载策略”。代码分割、异步加载、长效缓存本质都依赖这层映射。

## 2.4 Vite 的设计理念与链路差异

Vite 的核心目标是缩短反馈回路，特别是本地开发阶段的冷启动和热更新延迟。

### 2.4.1 开发阶段：基于 ESM 的按需转换

Vite 在开发阶段不预先打包全量依赖，而是利用浏览器原生 ESM 能力，按请求粒度进行转换与返回。其结果是：

- 启动更快：避免首次全量构建；
- 变更反馈更快：只处理受影响模块；
- 调试更直观：模块边界更接近源码。

### 2.4.2 生产阶段：回归打包优化

在生产构建中，Vite 仍需要对资源做打包、压缩、分割和缓存优化，以满足线上性能与稳定性要求。也就是说，Vite 不是“不要打包”，而是在不同阶段采用不同策略。

### 2.4.3 与 Webpack 的本质差异

两者并非简单“新旧替代”关系，而是对开发效率与生态兼容性的不同取舍：

- Webpack：生态广、可定制性强、适合复杂构建治理；
- Vite：开发体验优先、默认链路更轻、反馈速度更快。

工具选择应服从项目约束，而非社区热度。

## 2.5 Dev 与 Build：两条链路，两类优化目标

很多团队的瓶颈来自把开发链路和生产链路混为一谈。实际上两者优化目标完全不同。

### 2.5.1 Dev 链路目标：即时反馈

- 冷启动速度；
- 热更新耗时；
- 调试可读性；
- 增量变更影响面。

### 2.5.2 Build 链路目标：可部署质量

- 产物体积与加载效率；
- 长缓存友好性；
- 构建稳定性与可复现性；
- 产物安全与兼容性。

同一项技术在两条链路中的权重可能相反。例如，开发阶段更重调试体验，生产阶段更重压缩与稳定。

## 2.6 构建性能优化的方法论

构建优化不是“堆参数”，而是“识别瓶颈 -> 设计策略 -> 验证收益”的闭环。

### 2.6.1 识别瓶颈

先回答三个问题：

- 慢在解析、转换、还是打包输出阶段？
- 是冷启动慢，还是增量编译慢？
- 是 CPU 计算瓶颈，还是 I/O 与依赖结构瓶颈？

### 2.6.2 设计策略

常见策略可以归纳为四类：

- 减少工作量：按需编译、减少不必要转换；
- 提升并行度：合理利用多核与任务调度；
- 强化缓存：依赖缓存、结果缓存、远程缓存；
- 优化依赖结构：降低耦合、控制包体积、减少重复依赖。

### 2.6.3 验证收益

没有量化就没有优化。建议至少跟踪：

- 本地冷启动时间；
- 热更新平均耗时；
- CI 构建总时长；
- 产物总大小与关键路径资源大小。

## 2.7 本仓库中的构建体系映射（轻量）

本仓库是一个 Monorepo 结构，适合用来观察“构建工具如何服务于架构体系”。

- `apps/`：应用层工程，承载具体业务入口；
- `packages/`：可复用能力层，沉淀跨应用共享模块；
- `compiler/`：编译相关实验与原理实践；
- `server/`：服务端协作能力（如 BFF 场景）；
- 根目录 `turbo.json`：任务编排与流水线治理入口。

这类目录划分本质上是在做“责任分层”。构建工具并不是孤立存在，而是与目录规范、依赖边界和交付策略共同组成工程系统。

## 2.8 实战：mini-webpack 核心实现解析

> 本节对应仓库中的 `packages/mini-webpack/index.js`，通过 265 行代码实现一个可运行的 bundler，展示构建工具的核心链路。

### 2.8.1 整体架构

```
┌──────────────┐     apply()    ┌────────────────┐
│    Plugin    │ ─────────────► │     Hooks      │
└──────────────┘                │  run/emit/done │
                                └───────┬────────┘
┌──────────────┐     rules      ┌───────▼────────┐
│    Loader    │ ◄────────────── │  MiniWebpack   │
└──────────────┘                │                │
                                │ _parseModule() │
                                │ _createBundle()│
                                │    run()       │
                                └───────┬────────┘
                                        │ write
                                ┌───────▼────────┐
                                │  bundle.js     │
                                └────────────────┘
```

整个编译器由三部分组成：
- **Hooks**：轻量级事件系统，为 plugin 提供生命周期扩展点；
- **MiniWebpack**：核心编译类，负责模块图构建、代码转换、产物生成；
- **CLI 入口**：读取配置、创建编译器实例、触发构建流程。

### 2.8.2 Hooks：插件生命周期系统

对应章节 2.3.2 中"plugin 通过监听编译生命周期钩子实现能力扩展"的描述。

```js
class Hooks {
  constructor() {
    // 三个生命周期：编译开始 / 产物生成前 / 构建完成
    this.events = { run: [], emit: [], done: [] };
  }

  // 注册监听（类比 webpack 的 compiler.hooks.xxx.tap）
  tap(name, fn) {
    this.events[name].push(fn);
  }

  // 触发所有监听函数
  call(name, payload) {
    for (const fn of this.events[name] || []) fn(payload);
  }
}
```

plugin 只需实现 `apply(compiler)` 方法，通过 `compiler.hooks.tap()` 注册回调，即可在指定阶段介入构建：

```js
class BuildLogPlugin {
  apply(compiler) {
    compiler.hooks.tap('run',  () => console.log('[plugin] build start'));
    compiler.hooks.tap('emit', ({ asset }) => { /* 修改产物内容 */ });
    compiler.hooks.tap('done', () => console.log('[plugin] build done'));
  }
}
```

### 2.8.3 `_parseModule`：依赖递归解析，构建模块图

对应章节 2.2.2 中"解析依赖关系，构建模块图"。

```js
_parseModule(filePath) {
  const absPath = path.resolve(filePath);

  // 缓存机制：同一模块只解析一次，防止循环依赖导致死循环
  if (this.modules.has(absPath)) return this.modules.get(absPath);

  const moduleId  = this._createModuleId(absPath);       // 生成模块 ID
  const rawCode   = fs.readFileSync(absPath, 'utf-8');    // 读取源文件
  const loadedCode = this._applyLoaders(absPath, rawCode); // 经过 loader 转换
  const imports   = extractImports(loadedCode);           // 提取 import 语句

  const dependencies = {};
  for (const item of imports) {
    if (!isRelativeImport(item.source)) continue; // 跳过 npm 包
    const depAbsPath = normalizeRequest(absPath, item.source);
    const depModule  = this._parseModule(depAbsPath); // 递归解析依赖
    dependencies[item.source] = depModule.id;
  }

  const transformedCode = transformImports(loadedCode, dependencies); // ESM → CJS
  const moduleInfo = { id: moduleId, filePath: absPath, dependencies, code: transformedCode };
  this.modules.set(absPath, moduleInfo); // 写入模块图
  return moduleInfo;
}
```

关键点：**先缓存、再递归**，这是避免循环依赖无限递归的核心手段。

### 2.8.4 `transformImports`：ESM 转 CommonJS

浏览器运行产物使用 CommonJS 模块格式，因此需要把 ES Modules 语法转换为 `require/module.exports`。

```js
// import { framework } from './message'
// ↓ 转换为
const { framework } = __mini_require__("src/message.js");

// import getMessage from './message'
// ↓ 转换为
const getMessage = __mini_require__("src/message.js").default || __mini_require__("src/message.js");

// export const framework = "mini-webpack"
// ↓ 转换为
const framework = "mini-webpack";
module.exports.framework = framework;

// export default function getMessage() {...}
// ↓ 转换为
module.exports.default = function getMessage() {...}
```

这里的 `__mini_require__` 是最终 bundle 中的模块加载函数，并非 Node.js 的 `require`。

### 2.8.5 `_createBundle`：生成 IIFE 产物

对应章节 2.3.3 中"构建工具把开发期模块关系映射为运行期加载策略"。

```js
_createBundle(entryModule) {
  // 把所有模块序列化为 key-value 记录
  const modulesRecord = [];
  for (const mod of this.modules.values()) {
    modulesRecord.push(
      `"${mod.id}": function(__mini_require__, module, exports) {\n${mod.code}\n}`
    );
  }

  // IIFE：自执行函数隔离作用域，内置 __mini_require__ 实现模块加载
  return `(function(modules){
  const cache = {};
  function __mini_require__(id){
    if(cache[id]) return cache[id].exports;   // 缓存已加载模块
    const module = { exports: {} };
    cache[id] = module;
    modules[id](__mini_require__, module, module.exports); // 执行模块
    return module.exports;
  }
  __mini_require__("${entryModule.id}"); // 从入口开始运行
})({
  ${modulesRecord.join(",\n")}
});`;
}
```

这种 IIFE + 模块注册表的模式是经典的 bundle 运行时设计，Webpack 早期产物也采用类似结构。

### 2.8.6 运行示例

```bash
# 在仓库根目录执行
pnpm --filter @book/mini-webpack run demo
```

预期输出：

```
[plugin] build start
[plugin] emit: bundle size = xxxx bytes
[plugin] build done
[mini-webpack] build done: .../examples/dist/bundle.js

# 执行产物
mini-webpack: build-tools chapter demo
```

## 2.9 章节小结

构建工具的学习不应停留在配置项记忆，而应上升到系统抽象：输入是什么、转换链路如何组织、输出如何服务运行与交付。Webpack 与 Vite 的差异，本质是对不同阶段目标的策略取舍。真正可持续的构建优化，来自可观测、可度量、可迭代的方法论，而不是一次性调参。下一章将进一步进入状态管理体系，讨论应用运行时的数据组织问题。
