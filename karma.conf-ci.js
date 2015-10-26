var fs = require('fs');
var conf = require('./karma.conf.js').conf
var _ = require('lodash')

module.exports = function(config) {

  // Use ENV vars on Travis and sauce.json locally to get credentials
  if (!process.env.SAUCE_USERNAME) {
    if (!fs.existsSync('sauce.json')) {
      console.log('Create a sauce.json with your credentials based on the sauce-sample.json file.');
      process.exit(1);
    } else {
      process.env.SAUCE_USERNAME = require('./sauce.json').SAUCE_USERNAME;
      process.env.SAUCE_ACCESS_KEY = require('./sauce.json').SAUCE_ACCESS_KEY;
    }
  }

  // Browsers to run on Sauce Labs
  var customLaunchers = {
    'SL_Chrome': {
      base: 'SauceLabs',
      browserName: 'chrome'
    },
    'SL_InternetExplorer': {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      version: '10'
    },
    'SL_FireFox': {
      base: 'SauceLabs',
      browserName: 'firefox',
    }
  };

  config.set(_.merge({

    reporters: ['mocha', 'saucelabs'],

    port: 9876,
    colors: true,
    plugins:  [ require('karma-sauce-launcher') ].concat(conf.plugins),

    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,
    sauceLabs: {
      testName: 'mocking away!'
    },
    captureTimeout: 120000,
    customLaunchers: customLaunchers,
    browsers: Object.keys(customLaunchers),

  }, conf));
};
