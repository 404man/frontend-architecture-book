#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function isRelativeImport(request) {
  return request.startsWith("./") || request.startsWith("../");
}

function normalizeRequest(fromFile, request) {
  const basedir = path.dirname(fromFile);
  const absPath = path.resolve(basedir, request);
  if (path.extname(absPath)) {
    return absPath;
  }
  return `${absPath}.js`;
}

function extractImports(code) {
  const imports = [];
  const importRegex = /import\s+([^'"]+)\s+from\s+['"]([^'"]+)['"];?/g;
  let match = importRegex.exec(code);
  while (match) {
    imports.push({
      full: match[0],
      specifier: match[1].trim(),
      source: match[2].trim(),
    });
    match = importRegex.exec(code);
  }
  return imports;
}

function transformImports(code, dependencies) {
  let transformed = code;
  const exportedNames = [];
  const importRegex = /import\s+([^'"]+)\s+from\s+['"]([^'"]+)['"];?/g;
  transformed = transformed.replace(importRegex, (_, specifier, source) => {
    const depId = dependencies[source];
    if (depId == null) {
      return _;
    }
    const clean = specifier.trim();
    if (clean.startsWith("{") && clean.endsWith("}")) {
      return `const ${clean} = __mini_require__("${depId}");`;
    }
    if (clean.includes("{")) {
      const parts = clean.split(",");
      const defaultName = parts[0].trim();
      const named = parts.slice(1).join(",").trim();
      return `const ${defaultName} = __mini_require__("${depId}").default || __mini_require__("${depId}"); const ${named} = __mini_require__("${depId}");`;
    }
    return `const ${clean} = __mini_require__("${depId}").default || __mini_require__("${depId}");`;
  });

  transformed = transformed.replace(
    /export\s+default\s+/g,
    "module.exports.default = "
  );
  transformed = transformed.replace(/export\s+const\s+([a-zA-Z_$][\w$]*)\s*=\s*/g, (_, name) => {
    exportedNames.push(name);
    return `const ${name} = `;
  });
  transformed = transformed.replace(/export\s+function\s+([a-zA-Z_$][\w$]*)\s*\(/g, (_, name) => {
    exportedNames.push(name);
    return `function ${name}(`;
  });
  transformed = transformed.replace(
    /export\s+\{([^}]+)\};?/g,
    (_, names) =>
      names
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean)
        .map((n) => `module.exports.${n} = ${n};`)
        .join("\n")
  );

  if (exportedNames.length > 0) {
    transformed += `\n${exportedNames
      .map((name) => `module.exports.${name} = ${name};`)
      .join("\n")}\n`;
  }
  return transformed;
}

class Hooks {
  constructor() {
    this.events = {
      run: [],
      emit: [],
      done: [],
    };
  }

  tap(name, fn) {
    if (!this.events[name]) {
      throw new Error(`Unknown hook: ${name}`);
    }
    this.events[name].push(fn);
  }

  call(name, payload) {
    const fns = this.events[name] || [];
    for (const fn of fns) {
      fn(payload);
    }
  }
}

class MiniWebpack {
  constructor(config) {
    this.config = config;
    this.rootContext = config.context || process.cwd();
    this.entry = path.resolve(this.rootContext, config.entry);
    this.output = config.output || {
      path: path.resolve(this.rootContext, "dist"),
      filename: "bundle.js",
    };
    this.moduleRules = (config.module && config.module.rules) || [];
    this.plugins = config.plugins || [];
    this.hooks = new Hooks();
    this.modules = new Map();
    this.moduleIdByPath = new Map();
    this.moduleCounter = 0;
    this._registerPlugins();
  }

  _registerPlugins() {
    for (const plugin of this.plugins) {
      if (plugin && typeof plugin.apply === "function") {
        plugin.apply(this);
      }
    }
  }

  _createModuleId(filePath) {
    if (this.moduleIdByPath.has(filePath)) {
      return this.moduleIdByPath.get(filePath);
    }
    const id = toPosix(path.relative(this.rootContext, filePath));
    this.moduleIdByPath.set(filePath, id || `module_${this.moduleCounter++}`);
    return this.moduleIdByPath.get(filePath);
  }

  _applyLoaders(filePath, sourceCode) {
    let code = sourceCode;
    const matchedRules = this.moduleRules.filter((rule) => rule.test.test(filePath));
    for (const rule of matchedRules) {
      const useLoaders = Array.isArray(rule.use) ? rule.use : [rule.use];
      for (let i = useLoaders.length - 1; i >= 0; i -= 1) {
        const loader = useLoaders[i];
        if (typeof loader === "function") {
          code = loader(code, filePath);
        } else if (typeof loader === "string") {
          const loaderFn = require(loader);
          code = loaderFn(code, filePath);
        }
      }
    }
    return code;
  }

  _parseModule(filePath) {
    const absPath = path.resolve(filePath);
    if (this.modules.has(absPath)) {
      return this.modules.get(absPath);
    }

    const moduleId = this._createModuleId(absPath);
    const rawCode = fs.readFileSync(absPath, "utf-8");
    const loadedCode = this._applyLoaders(absPath, rawCode);
    const imports = extractImports(loadedCode);
    const dependencies = {};

    for (const item of imports) {
      if (!isRelativeImport(item.source)) {
        continue;
      }
      const depAbsPath = normalizeRequest(absPath, item.source);
      const depModule = this._parseModule(depAbsPath);
      dependencies[item.source] = depModule.id;
    }

    const transformedCode = transformImports(loadedCode, dependencies);
    const moduleInfo = {
      id: moduleId,
      filePath: absPath,
      dependencies,
      code: transformedCode,
    };
    this.modules.set(absPath, moduleInfo);
    return moduleInfo;
  }

  _createBundle(entryModule) {
    const modulesRecord = [];
    for (const mod of this.modules.values()) {
      modulesRecord.push(
        `"${mod.id}": function(__mini_require__, module, exports) {\n${mod.code}\n}`
      );
    }

    return `(function(modules){\n` +
      `  const cache = {};\n` +
      `  function __mini_require__(id){\n` +
      `    if(cache[id]) return cache[id].exports;\n` +
      `    if(!modules[id]) throw new Error("Cannot find module: " + id);\n` +
      `    const module = { exports: {} };\n` +
      `    cache[id] = module;\n` +
      `    modules[id](__mini_require__, module, module.exports);\n` +
      `    return module.exports;\n` +
      `  }\n` +
      `  __mini_require__("${entryModule.id}");\n` +
      `})({\n${modulesRecord.join(",\n")}\n});\n`;
  }

  run() {
    this.hooks.call("run", { compiler: this });
    const entryModule = this._parseModule(this.entry);
    const bundle = this._createBundle(entryModule);
    fs.mkdirSync(this.output.path, { recursive: true });
    const outputFile = path.resolve(this.output.path, this.output.filename);
    const asset = { bundle, outputFile };
    this.hooks.call("emit", { compiler: this, asset });
    fs.writeFileSync(outputFile, asset.bundle, "utf-8");
    this.hooks.call("done", { compiler: this, outputFile });
    return outputFile;
  }
}

function loadConfig(configPath) {
  const absConfigPath = path.resolve(configPath);
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const config = require(absConfigPath);
  return { ...config, context: config.context || path.dirname(absConfigPath) };
}

function runCli() {
  const defaultConfig = path.resolve(process.cwd(), "mini-webpack.config.js");
  const argConfig = process.argv[2];
  const configPath = argConfig ? path.resolve(process.cwd(), argConfig) : defaultConfig;
  if (!fs.existsSync(configPath)) {
    console.error(`[mini-webpack] config not found: ${configPath}`);
    process.exit(1);
  }
  const config = loadConfig(configPath);
  const compiler = new MiniWebpack(config);
  const outputFile = compiler.run();
  console.log(`[mini-webpack] build done: ${outputFile}`);
}

module.exports = {
  MiniWebpack,
  loadConfig,
};

if (require.main === module) {
  runCli();
}
