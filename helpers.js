
module.exports = {
  merge: merge,
  isFullUrl: isFullUrl,
  hasQueryString: hasQueryString,
  getAppropriateUrl: getAppropriateUrl
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

/**
 * Extracts the url we'd like to test against, based implicitly on pathlike
 * Eg: if pathlike is a full url, we'd like to test against the full url
 */
function getAppropriateUrl(req,pathlike) {
  if(isFullUrl(pathlike)) {
    return req.url
  }
  if(hasQueryString(pathlike)) {
    return req.path
  }
  return req.pathname
}


