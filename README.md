# xmock

Just a simple way to mock out your API calls, without running a server.
Its express-like, fast and hopefully simple to use.
I aim to make to 1-to-1 compatible with express 4.x, so that I can play with middleware :smile:

[![Sauce Test Status](https://saucelabs.com/browser-matrix/ponelat-xmock.svg)](https://saucelabs.com/u/ponelat-xmock)

## Installation

node:

```
$ npm install xmock
```


Works with [webpack](https://webpack.github.io/) and should work with [browserify](https://github.com/substack/node-browserify) 

```js

  // In node.js or your browser (you need to bundle)

  var xapp = xmock()
  
  // GET http://localhost/some/value?one=1
  xapp.get('/some/:thing', function(req,res,next) {

    req.header // -> { 'Content-Type': 'application/json'}
    req.params // -> { thing: 'value' }
    req.query // -> { one: '1' }

    res
    .set('X-Cool-Thing', req.params.thing)
    .status(201)

    next()
  })

  // Keep the middleware going!
  xapp.use(function(req,res,next) {
    // Same request above
    res.send({some: 'json'})
  })

  // And when you want to remove all your middleware

  xapp.reset() // still listenening, but without any middleware

```

## Supports the usual http methods ...

- .get
- .post
- .put
- .delete
- .patch


## Restoring normal http requests

- `.restore() -> ` 
    will allow normal requests to go through, but will leave your middleware intact

- `.install() -> ` 
    same as xmock(), it'll capture the http requests

- `.reset() ->`
    removes the middleware (under the hood it just resets the callback array)


## Path matching

Uses express-like paths, or regexp or full path


```js
  xapp.get('/some/:thing/optional?', function(){})
  xapp.get(/some(.*)/, function(){}) // regexp with groups
  xapp.get('http://www.google.com', function(){}) // full paths
```


## Middleware

Such an awesome concept, is middleware!

```js
  // So, things like arguments as middleware
  xapp.use(doSomething, mutateSomeMore, checkIfHasParams, function(req,res,next) {})


  // Catch-alls
  xapp.use(function(req,res,next){
    // will get called with every request, unless the chain already ended
  })

  // Catch-alls, but only for certain methods
  xapp.get(function(req,res,next) {})

```

## Credit

All of this is definitely not possible, without the great work done on these projects... [faux-jax](https://github.com/algolia/faux-jax) and [path-to-regexp](https://github.com/pillarjs/path-to-regexp)
