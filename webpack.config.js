const path = require('path');

module.exports = {
  entry: './exchange.js',  // Шлях до вашого файлу
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'development'
};