var baseConf = require('./karma.conf-base')
var _ = require('lodash')

module.exports = function (config) {
  config.set(_.merge({
    browsers: [ 'Firefox' ], //run in Chrome
    plugins: [
      require('karma-firefox-launcher'),
    ]
  }, baseConf))
}

