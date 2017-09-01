const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  entry: {
    background: ['./src/background.ts'],
    contentScript: ['./src/contentScript.ts'],
    graphSerializer: ['./src/graphSerializer.ts'],
    launcher: ['./src/launcher.ts'],
    panel: ['./src/panel/index.ts'],
    'hot-reload': ['./src/hot-reload.ts'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    sourceMapFilename: '[name].js.map'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  module: {
    loaders: [
      {
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader',
      }
    ]
  },
  devtool: 'source-map',
  plugins: [
    new CleanWebpackPlugin(['./dist']),
    new CopyWebpackPlugin([
      { context: './src', from: '*' }
    ], {
      ignore: [
        '*.ts',
        '*.tsx',
      ]
    })
  ]
};

