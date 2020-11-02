const { merge } = require('webpack-merge');
const webpack = require("webpack");
const common = require('./webpack.common.js');

module.exports = 
common.map(commonElement => {
  return merge(commonElement, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
      contentBase: './dist',
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env.MAP_BOX_ACCESS_TOKEN":JSON.stringify(process.env.MAP_BOX_ACCESS_TOKEN_LOCAL)
      })
    ]
  });
})
