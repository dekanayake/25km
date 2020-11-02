const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require("webpack");


module.exports = 
common.map(commonElement => {
  return merge(commonElement, {
    mode: 'production',
    plugins: [
      new webpack.DefinePlugin({
        "process.env.MAP_BOX_ACCESS_TOKEN": JSON.stringify(process.env.MAP_BOX_ACCESS_TOKEN_PROD)
      })
    ]
  });
})