var fauxJax = require('faux-jax')
var pathToRegexP = require('path-to-regexp')
var urlApi = require('url')

module.exports = XMock

function XMock() {
  if(!(this instanceof XMock)) { return new XMock() }
  this._callbacks = []
  this.listenToFauxJax()
}

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


XMock.prototype.reset = function(fn) {
  this._callbacks = []
}


XMock.prototype.listenToFauxJax = function() {
  var self = this
  if(this._listener) {
    fauxJax.removeListener(this._listener)
  }
  this._listener = setupFauxJax(function(req,res) { self.dispatch(req,res) })
}

XMock.prototype.fallback = function(req,res) {
  if(this._unhandled) {
    return this._unhandled(req,res)
  }
  throw new Error('Unhandled request in xmock')
  // req.respond(404, {}, 'ERR')
}

XMock.prototype.use = function(first, second) {
  var path = '*'
  var self = this
  var args = [].slice.call(arguments)
  var method

  // Path
  if(typeof first === 'string') {
    path = first
    args = args.slice(1)
  }

  // Method
  if(typeof second === 'string') {
    method = second.toLowerCase()
    args = args.slice(1)
  }

  var route = new Route(path, method)
  args.forEach(function(fn) {
    var middle = route.middleware(fn)
    self._callbacks.push(middle)
  })
}

XMock.prototype.get = function(fn) {
  var route = new Route('*', 'get')  
  this._callbacks.push(route.middleware(fn))
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
  req.headers = req.requestHeaders
  req.body = req.requestBody
  var urlParsed = urlApi.parse(req.url)
  merge(req, urlParsed)
  return req
}

function merge(dest, src) {
  for(var i in src) {
    if(src.hasOwnProperty(i)) {
      if(dest[i]) {
        console.log('warning, overwriting ' + i)
      }
      dest[i] = src[i]
    }
  }
}

function Response(respond) {
  this.body = {}
  this.headers = {
    'Content-type': 'application/json'
  }
  this.code = 400
  this._respond = respond

  // req.respond(
  //   200, { // status
  //     'Content-Type': 'application/json' // headers
  //   },
  //   '{"zup": "bro?"}' //body
  // );
}

Response.prototype.end = function() {
  var bodyStr = (typeof this.body === 'object') ? JSON.stringify(this.body) : this.body
  if(!bodyStr || bodyStr === '') {
    throw new Error('No body provided in response')
  }

  this._respond(this.code, this.headers, bodyStr)
}

Response.prototype.status = function(code) {
  this.code = code
  return this
}

Response.prototype.send = function(body) {
  this.body = body
  this.end()
}

function Route(path, method) {
    this.path = (path === '*') ? '(.*)' : path
    this.method = 'get'
    this.regexp = pathToRegexP(this.path, this.keys = [])
    this.method = method
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
      if(req.host === 'localhost') {
        url = req.pathname
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
