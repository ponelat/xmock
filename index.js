var Mocker = require('faux-jax')
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
  this._bypass = []
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
  if(this._destroy) {
    this._destroy()
  }
  this._destroy = setupMockListener({
    request: function (req,res) {
      self.dispatch(req,res)
    },
    connect: function (socket, opts) {
      self._bypass.forEach(function (host) {
        Helpers.matchDomain(host, opts.host) ? socket.bypass() : null
      })
    }
  })
}

XMock.prototype.bypass = function (host) {
  this._bypass.push(host)
  return this
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

function setupMockListener(opts) {
  var opts = opts || {}
  var oriNewSocket = Mocker._newSocket

  Mocker._newSocket = function (socket, socket_opts) {
    opts.connect ? opts.connect(socket,socket_opts) : null
  }

  if(!Mocker._installed) {
    Mocker.install()
  }

  var listener = function(req) {
    var end = function() { req.respond.apply(req, arguments) }
    opts.request ? opts.request(req, new Response(end)) : null
  }

  Mocker.on('request', listener)

  return function restore() {
    Mocker.removeListener('request', listener)
    Mocker._newSocker = oriNewSocket
  }
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


