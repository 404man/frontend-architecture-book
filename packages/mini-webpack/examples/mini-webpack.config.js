const path = require("node:path");

function bannerLoader(source) {
  const banner = "// transformed by bannerLoader\n";
  return `${banner}${source}`;
}

class BuildLogPlugin {
  apply(compiler) {
    compiler.hooks.tap("run", () => {
      console.log("[BuildLogPlugin] build started");
    });

    compiler.hooks.tap("emit", ({ asset }) => {
      asset.bundle = `${asset.bundle}\n// emitted by BuildLogPlugin\n`;
      console.log("[BuildLogPlugin] emit bundle");
    });

    compiler.hooks.tap("done", ({ outputFile }) => {
      console.log(`[BuildLogPlugin] build finished: ${outputFile}`);
    });
  }
}

module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [bannerLoader],
      },
    ],
  },
  plugins: [new BuildLogPlugin()],
};
