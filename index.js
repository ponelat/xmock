var fauxJax = require('faux-jax')
var pathToRegexp = require('path-to-regexp')
var urlApi = require('url')

module.exports = xmock

// Used to generate docs too
var METHODS = ['get', 'put', 'post', 'options', 'delete' ]
var META = {
  methods: METHODS
}

var singleton
function xmock() {
  if(!singleton) {
    singleton = new XMock()
    singleton._meta = META
  }
  return singleton
}

// ===== functions

function setupFauxJax(cb) {
  if(!fauxJax._installed) {
    fauxJax.install()
  }

  var listener = function(req) {
    var end = function() { req.respond.apply(req, arguments) }
    cb(req, new Response(end))
  }

  fauxJax.on('request', listener)
  return listener
}

function merge(dest, src) {
  for(var i in src) {
    if(src.hasOwnProperty(i)) {
      if(typeof dest[i] == 'undefined') {
        dest[i] = src[i]
      }
    }
  }
}

function isFullUrl(expressLike) {

  // Can't determine from regex, so assume full url
  if(expressLike instanceof RegExp) {
    return true
  }

  if(typeof expressLike !== 'string') {
    return false
  }

  if(/^https?:\/\/.*/i.test(expressLike)) {
    return true
  }

  if(/^[\w-]+\..*/.test(expressLike)) {
    return true
  }
}

function hasQueryString(expressLike) {
  if(expressLike instanceof RegExp) {
    return true
  }

  if(typeof expressLike !== 'string') {
    return false
  }

  if( /\?[^\/]+/.test(expressLike)) {
    return true
  }

}

// ========= Classes

function XMock() {
  this._callbacks = []
  this._requestListener = null
  this.install()
}


// 'patch' doesn't work in firefox (at least)
METHODS.forEach(function(method, i){

  XMock.prototype[method] = function(first,second) {
    var args = [].slice.call(arguments)
    var path

    // Extract Path
    if(typeof first === 'function') {
      path = '*'
    } else {
      var path = first
      args = args.slice(1)
    }

    return this.middleware({
      path: path,
      method: method,
      middleware: args
    })

  }

})

XMock.prototype.reset = function(fn) {
  this._callbacks = []
}

XMock.prototype.restore = function() {
  fauxJax.restore()
}

XMock.prototype.install = function() {
  this.listenToFauxJax()
}

XMock.prototype.listenToFauxJax = function() {
  var self = this
  if(this._requestListener) {
    fauxJax.removeListener('request', this._requestListener)
  }
  this._requestListener = setupFauxJax(function(req,res) {
    self.dispatch(req,res)
  })
}

XMock.prototype.fallback = function(req,res) {
  if(this._unhandled) {
    return this._unhandled(req,res)
  }
  throw new Error('Unhandled request in xmock: ' + req.method.toUpperCase() + ' ' +req.url)
}

XMock.prototype.use = function(first, second) {
  var path = '*'
  var args = [].slice.call(arguments)
  var method

  // Path
  if(typeof first === 'string' || first instanceof RegExp) {
    path = first
    args = args.slice(1)
  }

  // Method
  if(typeof second === 'string') {
    method = second.toLowerCase()
    args = args.slice(1)
  }

  return this.middleware({
    path: path,
    method: method,
    middleware: args
  })

}

XMock.prototype.middleware = function(opts) {
  var self = this
  var path = opts.path || '*'
  var method = opts.method
  var middleware = opts.middleware

  var route = new Route(path, method)
  middleware.forEach(function(fn) {
    var middle = route.middleware(fn)
    self._callbacks.push(middle)
  })
  return this
}

XMock.prototype.dispatch = function(req, res) {
  var i = 0, j = 0;
  var self = this
  req = mutateRequest(req)

    function nextEnter() {
      var fn = self._callbacks[i++];
      if(!fn) return self.fallback(req,res) // unhandled
      fn(req, res, nextEnter);
    }

    nextEnter();
  };

function mutateRequest(req) {
  req.url = req.requestURL
  req.method = req.requestMethod.toLowerCase()
  req.header = req.requestHeaders
  req.body = req.requestBody
  var urlParsed = urlApi.parse(req.url, true)
  merge(req, urlParsed)
  return req
}

function Response(respond) {
  this.body = {}
  this.header = {
    'Content-type': 'application/json'
  }
  this.code = 400
  this._respond = respond
}

Response.prototype.end = function() {
  var bodyStr = (typeof this.body === 'object') ? JSON.stringify(this.body) : this.body

  this._respond(this.code, this.header, bodyStr)
}

Response.prototype.status = function(code) {
  this.code = code
  return this
}

Response.prototype.send = function(body) {
  this.body = body
  this.end()
}

Response.prototype.set = function(header, value) {
  if(header && typeof header === 'object') {
    merge(this.header, header)
  } else {
    this.header[header] = value
  }
  return this
}

function Route(path, method) {
    this.path = (path === '*') ? '(.*)' : path
    this.regexp = pathToRegexp(this.path, this.keys = [], {end: false})
    this.method = method
    this.matchQueryString = hasQueryString(path)
    this.fullUrl = isFullUrl(path)
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
