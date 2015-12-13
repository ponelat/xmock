var Helpers = require('./helpers')

module.exports = Response

function Response(respond) {
  this.body = {}
  this.header = {
    'Content-type': 'application/json'
  }
  this.code = 200
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
    Helpers.merge(this.header, header)
  } else {
    this.header[header] = value
  }
  return this
}
