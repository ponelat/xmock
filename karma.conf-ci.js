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
      browserName: 'chrome',
      version: '45'
    },
    'SL_Firefox': {
      base: 'SauceLabs',
      browserName: 'firefox',
      version: '39'
    },
    'SL_Safari': {
      base: 'SauceLabs',
      browserName: 'safari',
      platform: 'OS X 10.10',
      version: '8'
    },
    'SL_IE_9': {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 2008',
      version: '9'
    },
    'SL_IE_10': {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 2012',
      version: '10'
    },
    'SL_IE_11': {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 8.1',
      version: '11'
    },
    'SL_iOS': {
      base: "SauceLabs",
      browserName: "iphone",
      platform: "OS X 10.10",
      version: "8.1"
    }
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
      build: require('./package.json').version + ' - ' + process.env.TRAVIS_BUILD_NUMBER,
      tags: ['mock', 'xhr', 'http'],
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
