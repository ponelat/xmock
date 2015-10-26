var fs = require('fs');
var baseConf = require('./karma.conf-base')
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

    reporters: ['saucelabs'],

    port: 9876,
    colors: true,
    plugins:  [ require('karma-sauce-launcher') ],

    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,
    sauceLabs: {
      testName: 'xmock',
      recordScreenshots: false,
      build: process.env.TRAVIS_BUILD_NUMBER,
      tags: ['mock', 'xhr', 'http'],
      version: require('./package.json').version,
      connectOptions: {
        port: 5757,
        logfile: 'sauce_connect.log'
      },
      public: 'public'
    },
    captureTimeout: 120000,
    customLaunchers: customLaunchers,
    browsers: Object.keys(customLaunchers),

  }, baseConf));
};
