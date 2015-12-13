var pathToRegexp = require('path-to-regexp')
var Helpers = require('./helpers')

module.exports = Route

function Route(path, method) {
    this.path = (path === '*') ? '(.*)' : path
    this.regexp = pathToRegexp(this.path, this.keys = [], {end: false})
    this.method = method
    this.matchQueryString = Helpers.hasQueryString(path)
    this.fullUrl = Helpers.isFullUrl(path)
}

/**
 * Return route middleware with
 * the given callback `fn()`.
 *
 * @param {Function} fn
 * @return {Function}
 * @api public
 */

Route.prototype.middleware = function(fn) {
  var self = this;
  return function(req,res,next) {
    var url
    if(!self.fullUrl) {

      url = req.pathname

      if(self.matchQueryString) {
        url = req.path
      }

    } else {
      url = req.url
    }


    // Match method... /if/ its there
    if(self.method && self.method !== req.method) {
      return next()
    }

    var m = self.match(url)

    if (m) {
      req.params = m
      return fn(req,res,next);
    }
    next()
  }
}

/**
 * Check if this route matches `path`, if so
 * populate `params`.
 *
 * @param {String} path
 * @param {Object} params
 * @return {Boolean}
 * @api private
 */

Route.prototype.match = function(path) {
  var keys = this.keys
    , m = this.regexp.exec(path)
    , params = {}


  if (!m) return false;

  for (var i = 1, len = m.length; i < len; ++i) {
    var key = keys[i - 1];
    var val = m[i];
    if (val !== undefined || !(hasOwnProperty.call(params, key.name))) {
      params[key.name] = val;
    }
  }

  return params
}
