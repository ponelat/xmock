
module.exports = {
  merge: merge,
  isFullUrl: isFullUrl,
  hasQueryString: hasQueryString,
  lowerCaseKeys: lowerCaseKeys,
  isType: isType
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


