const path = require("path");

module.exports = {
  mode: "development",
  context: path.join(__dirname, "src"),
  entry: {
    constantLoad: "./constantLoad.ts",
    constantLoadExternallyOrchestrated:
      "./constantLoadExternallyOrchestrated.ts",
    constantLoadSwitchHalfwayExternallyOrchestrated:
      "./constantLoadSwitchHalfwayExternallyOrchestrated.ts",
    flashCrowd: "./flashCrowd.ts",
    flashCrowdExternallyOrchestrated: "./flashCrowdExternallyOrchestrated.ts",
    training: "./training.ts",
    seed: "./seed.ts",
  },
  output: {
    path: path.join(__dirname, "dist"),
    libraryTarget: "commonjs",
    filename: "[name].js",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "babel-loader",
      },
    ],
  },
  target: "web",
  externals: /^k6(\/.*)?/,
  stats: {
    colors: true,
  },
};
