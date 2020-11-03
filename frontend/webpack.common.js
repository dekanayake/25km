const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const autoprefixer = require('autoprefixer');

module.exports = [{
    entry: './src/main.js',
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: 'index.html'
      }),
      new CopyPlugin({
        patterns: [{
          from: path.resolve(__dirname, 'metro.json'),
          to: path.resolve(__dirname, 'dist')
        }, {
          from: path.resolve(__dirname, './static/images/*'),
          to: path.resolve(__dirname, 'dist')
        }],
      })
    ],
    output: {
      filename: 'main.js',
      path: path.resolve(__dirname, 'dist'),
    },
    module: {
      rules: [
        {
          test: /\.html$/,
          use: ["html-loader"]
        },{
        test: /\.(jpe?g|jpg|png|gif|svg)$/i,
        loader: "file-loader",
        options :{
          esModule: false
        }
      }]
    }
  }, {
    entry: './src/measure.js',
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'measure.html',
        template: 'measure.html'
      }),
    ],
    output: {
      filename: 'measure.js',
      path: path.resolve(__dirname, 'dist'),
    },
  },
  {
    entry: './src/searchPlaces.js',
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'searchPlaces.html',
        template: 'searchPlaces.html'
      }),
    ],
    output: {
      filename: 'searchPlaces.js',
      path: path.resolve(__dirname, 'dist'),
    },
  },
  {
    entry: ['./app.scss', './app.js'],
    output: {
      // This is necessary for webpack to compile
      // But we never use style-bundle.js
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
    },
    module: {
      rules: [{
          test: /\.scss$/,
          use: [{
              loader: 'file-loader',
              options: {
                name: 'bundle.css',
              },
            },
            {
              loader: 'extract-loader'
            },
            {
              loader: 'css-loader'
            },
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
  }
];