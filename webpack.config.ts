import { Configuration } from "webpack";

const configuration: Configuration = {
  entry: "./src/index",

  output: {
    filename: "bundle.js",
  },

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },

  module: {
    loaders: [
      {
        loader: "awesome-typescript-loader",
        test: /\.tsx?$/,
      },
    ],
  },
};

export default configuration;
