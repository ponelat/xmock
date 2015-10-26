var path = require('path')

module.exports = {
  entry: './index',
  context: __dirname,
  output: {
    path: __dirname + '/dist',
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      { test: /.*\.json$/, loader: 'json-loader' },

    ]
  }
};
