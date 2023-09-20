const path = require('path');

module.exports = {
  mode: "development",
  target: 'node',
  devtool: "inline-source-map",
  entry: {
    main: "./src/start.ts",
  },
  output: {
    path: path.resolve(__dirname, './build'),
    filename: "synology-photo-copying-tool.js" // <--- Will be compiled to this single file
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      { 
        test: /\.tsx?$/,
        loader: "ts-loader"
      }
    ]
  }
};
