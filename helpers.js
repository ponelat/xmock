var Url = require('url')

module.exports = {
  merge: merge,
  isFullUrl: isFullUrl,
  hasQueryString: hasQueryString,
  lowerCaseKeys: lowerCaseKeys,
  isType: isType,
  zip: zip,
  matchDomain: matchDomain
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

function isType(test, type) {
  return Object.prototype.toString.call(test).toLowerCase() === '[object '+type+']'
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

  return false
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

function lowerCaseKeys(obj) {
  for(var key in  obj) {
    if(hasOwnProperty.call(obj, key)) {
      var val = obj[key]
      delete obj[key]
      obj[key.toLowerCase()] = val
    }
  }
  return obj
}

function corerceIntoUrlObj(str) {
  str = typeof str === 'string' ? str : ''
  if(!/^https?:\/\//.test(str)) {
    str = 'http://' + str
  }
  return Url.parse(str)
}

function matchDomain(host, testHost) {

  host = corerceIntoUrlObj(host).host
  testHost = corerceIntoUrlObj(testHost).host

  // Design Decision, don't match empty
  if(host === '') {
    return false
  }

  if(host === testHost) {
    return true
  }

  var hostDomain = host.split('.').reverse()
  var testHostDomain = testHost.split('.').reverse()

  var len = host.length
  for (var i = 0; i < len; i++) {
    if(host[i] !== testHost[i])
      return false
  }

  return true
}

function zip(left, right, fn) {
  var len = Math.min(left.length, right.length)
  var newArr = []
  for (var i = 0; i < len; i++) {
    fn ? newArr.push(fn(left[i], right[i])) : null
  }
  return newArr
}


