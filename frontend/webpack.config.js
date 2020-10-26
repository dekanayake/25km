const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const autoprefixer = require('autoprefixer');

  module.exports = [{
    mode: 'development',
    entry: './src/index.js',
    plugins: [
      new HtmlWebpackPlugin({
        template: 'index.html'
      }),
    ],
    output: {
      filename: 'main.js',
      path: path.resolve(__dirname, 'dist'),
    },
  },{
    entry:  ['./app.scss', './app.js'],
    output: {
      // This is necessary for webpack to compile
      // But we never use style-bundle.js
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
    },
    module: {
      rules: [
        {
          test: /\.scss$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: 'bundle.css',
              },
            },
            { loader: 'extract-loader' },
            { loader: 'css-loader' },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                 plugins: () => [autoprefixer()]
                }
              }
            },
            {
              loader: 'sass-loader',
              options: {
                // Prefer Dart Sass
                implementation: require('sass'),
            
                // See https://github.com/webpack-contrib/sass-loader/issues/804
                webpackImporter: false,
                sassOptions: {
                  includePaths: ['./node_modules']
                },
              }
            },
          ]
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          query: {
            presets: ['@babel/preset-env'],
          },
        }
      ]
    },
  }];