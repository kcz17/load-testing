const path = require("path");

module.exports = {
  mode: "development",
  context: path.join(__dirname, "src"),
  entry: {
    mixedFluctuatingSpikes: "./mixedFluctuatingSpikesRamping.ts",
    mixedConstantRamping: "./mixedConstantRamping.ts",
    mixedConstantRampingArrivalRate: "./mixedConstantRampingArrivalRate.ts",
    mixedSimple: "./mixedSimple.ts",
    training: "./training.ts",
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
