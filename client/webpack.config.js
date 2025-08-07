const { VueLoaderPlugin } = require('vue-loader');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './client/src/main.js',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'bundle.[contenthash].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        type: 'asset/resource',
        generator: {
          filename: 'img/[name].[contenthash:8][ext]'
        }
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      template: './client/src/index.html',
      filename: 'index.html',
      inject: true,
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
      },
      chunkSortMode: 'dependency'
    })
  ],
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      '@': path.resolve(__dirname, './client/src')
    }
  },
  devServer: {
    static: {
      directory: path.join(__dirname, '../dist')
    },
    compress: true,
    port: 8080
  }
};