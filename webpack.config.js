const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: {
    sidepanel: './src/sidepanel/index.tsx',
    background: './src/background/background.ts',
    content: './src/content/content.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/sidepanel/sidepanel.html',
      filename: 'sidepanel.html',
      chunks: ['sidepanel']
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'src/icons', to: 'icons' }
      ]
    }),
    new webpack.DefinePlugin({
      'process.env.HIGHLIGHT_DURATION_SECONDS': JSON.stringify(process.env.HIGHLIGHT_DURATION_SECONDS || '3'),
      'process.env.EXTENSION_NAME': JSON.stringify(process.env.EXTENSION_NAME || 'ChatGPT Compass'),
      'process.env.EXTENSION_VERSION': JSON.stringify(process.env.EXTENSION_VERSION || '1.0.0')
    })
  ],
  devtool: 'cheap-module-source-map'
}; 