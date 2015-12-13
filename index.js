var Mocker = require('./mocker')
var urlApi = require('url')
var Helpers = require('./helpers.js')
var Route = require('./route.js')
var Response = require('./response.js')

module.exports = xmock

var METHODS = Object.freeze(['get', 'put', 'post', 'options', 'delete' ])

function xmock(opts) {
  if(!XMock.singleton) {
    XMock.singleton = new XMock()
  }
  XMock.singleton.install(opts)
  XMock.singleton.reset()
  return XMock.singleton
}

// ========= Classes

function XMock() {
  this._callbacks = []
  this._requestListener = null
  this._class = XMock
}

XMock.prototype.reset = function(fn) {
  this._callbacks = []
}

XMock.prototype.restore = function() {
  if(Mocker._installed) {
    Mocker.restore()
  }
  return this
}

XMock.prototype.install = function(opts) {
  this.opts = opts || {}
  this.listenToFauxJax()
  return this
}

XMock.prototype.listenToFauxJax = function() {
  var self = this
  if(this._requestListener) {
    Mocker.removeListener('request', this._requestListener)
  }
  this._requestListener = setupFauxJax(function(req,res) {
    self.dispatch(req,res)
  })
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

    if(!fn) {
      return self.fallback(req,res) // unhandled
    }

    var returned = fn(req, res, nextEnter)

    // Handle shortcut method of return an object-or-array instead of using res.send
    if(Helpers.isType(returned, 'array')) {

      res.status(returned[0])
      res.set(returned[2])
      res.send(returned[1])

      return
    } else if(Helpers.isType(returned, 'object')) {
      return res.send(returned)
    }

  }

  nextEnter();
}

XMock.prototype.fallback = function(req,res) {
  if(this.opts.unhandled) {
    return this.opts.unhandled(req,res)
  }
  throw new Error('Unhandled request in xmock: ' + req.method.toUpperCase() + ' ' +req.url)
}

///////////////////////////////////////////////////////////////////////////////
//
// ===== functions

function setupFauxJax(cb) {
  if(!Mocker._installed) {
    Mocker.install()
  }

  var listener = function(req) {
    var end = function() { req.respond.apply(req, arguments) }
    cb(req, new Response(end))
  }

  Mocker.on('request', listener)
  return listener
}


function mutateRequest(req) {
  req.url = req.requestURL
  req.method = req.requestMethod.toLowerCase()

  req.header = req.requestHeaders
  Helpers.lowerCaseKeys(req.header)

  req.body = req.requestBody
  if(/json$/.test(req.header['content-type'])) {
    req.body = JSON.parse(req.body, null, 2)
  }

  var urlParsed = urlApi.parse(req.url, true)
  Helpers.merge(req, urlParsed)

  return req
}


