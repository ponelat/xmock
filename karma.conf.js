var path = require('path')
var webpack = require('./webpack.config.js')

module.exports = function (config) {
  config.set({
    browsers: [ 'Firefox' ], //run in Chrome
    singleRun: true, //just run once by default
    frameworks: [ 'mocha' ], //use the mocha test framework
    plugins: [
      require('karma-webpack'),
      require('karma-mocha'),
      require('karma-firefox-launcher'),
      // require('karma-phantomjs-launcher'), // One can install this locally, if one so desires to speed things up
      require('karma-sourcemap-loader'),
      require('karma-mocha-reporter')
    ],
    files: [
      'tests.webpack.js'
    ],
    preprocessors: {
      'tests.webpack.js': [ 'webpack', 'sourcemap' ], //preprocess with webpack and our sourcemap loader
    },
    reporters: [ 'mocha' ],
    webpack: { //kind of a copy of your webpack config
      devtool: 'inline-source-map', //just do inline source maps instead of the default
      module: webpack.module,
      resolve: webpack.resolve
    },
    webpackServer: {
      noInfo: true //please don't spam the console when running in karma!
    }
  });
};
