# xmock

Just a simple way to mock out your API calls, without running a server.
Its express-like, fast and hopefully simple to use.
I aim to make to 1-to-1 compatible with express 4.x, so that I can play with middleware :smile:


## Installation

node:

```
$ npm install xmock
```


Works with [browserify](https://github.com/substack/node-browserify) and should work with [webpack](https://github.com/visionmedia/superagent/wiki/Superagent-for-Webpack)

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
    req.send({some: 'json'})
  })

```

## Supports the usual http methods ...

- .get
- .post
- .put
- .delete
- .patch


## Restoring normal http requests

`.restore() -> ` will allow normal requests to go through, but will leave your middleware intact
`.install() -> ` same as xmock(), it'll capture the http requests


## Path matching

Uses express-like paths, or regexp or full path


```js
  xapp.get('/some/:thing/optional?')
  xapp.get(/some(.*)) // regexp with groups
  xapp.get('http://www.google.com') // full paths
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

## Browser

I'm waiting on implementing browser tests, to put this into 5th gear
