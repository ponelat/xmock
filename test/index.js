var expect = require('chai').expect
var xmock = require('../')
var request = require('superagent')
var fauxJax = require('faux-jax')
var async = require('async')

var METHODS = ['get', 'put', 'post', 'delete']

function aRequestShouldFail(done) {
  request.get('/something-random', function(err,res) {
    expect(err.code).to.eql('ECONNREFUSED')
    if(done) done()
  })
}

describe('xmock - init', function(){
  it('should call .install() on each xmock() call', function(done){
    var xapp
    async.series([
      aRequestShouldFail,
      function (cb) {
        xapp = xmock()
        xapp.get('/', function(req,res,next) {
          return {}
        })

        request.get('/test', function(err,res) {
          if(err) done(err)
          cb()
        })
      },
      function (cb) {
        xmock().restore()
        cb()
      },
      aRequestShouldFail,
      function (cb) {
        var xapp = xmock()
        xapp.get('/', function(req,res,next) {
          return {}
        })

        request.get('/test', function(err,res) {
          if(err) done(err)
          cb()
        })
      },

      function (cb) {
        xapp.restore()
        cb()
      }

    ],done)

  })

  describe('.restore()', function(){

    it('should allow normal requests to go through', function(done){
      xmock().restore()
      request('/abc').end(function(err,res) {
        expect(err).to.match(/ECONNREFUSED/)
        done()
      })
    })

  })
})

describe('xmock', function() {

  before(function(){
    this.xapp = xmock()
  })

  after(function(){
    this.xapp.restore()
  })

  beforeEach(function(){
    this.xapp.reset()
  })

  describe('basics', function(){

    it('should not have zombie middleware', function(done){

      this.xapp.use(function(req,res,next){
        res.status(201).send('...')
      })

      this.xapp.reset()

      this.xapp.use(function(req,res,next){
        res.status(202).send({})
      })

      request.get('/api').end(function(err, res) {
        if(err) {done(err)}
        expect(res.statusCode).to.deep.equal(202)
        done()
      })

    })

    it('should return a response', function(done){

      request.get('/api').end(function(err, res) {
        if(err) {done(err)}
        expect(res.statusCode).to.deep.equal(201)
        expect(res.body).to.deep.equal({hello: true})
        done()
      })

      this.xapp.use(function(req,res,next){
        res.status(201).send({hello: true})
      })

    })

    it('should restore mock\'d out http internals', function(done){

      var self = this

      // Add responder, for tryRequest
      self.xapp.use(function(req,res,next) {
        res.status(200).send({})
      })

      this.xapp.restore()

      request.get('/i-should-not-exist').end(function(err, res) {
        if(err) {
          return tryRequest()
        }
        done(new Error('Expected a ECONNREFUSED'))
      })

      // Called after we successfully "fail" to get a response
      function tryRequest() {
        self.xapp.install()

        request.get('/api').end(function(err, res) {
          if(err) { return done(err) }
          expect(res.ok).to.equal(true)
          done()
        })
      }


    })

  })

  describe('responses', function(){

    it('should return a response with express-like, res.status().end()', function(done){

      this.xapp.get('/api', function(req,res,next) {
        res.status(201).end()
      })

      request.get('/api').end(function(err,res) {
        expect(res.statusCode).to.eql(201)
        done()
      })

    })

    it('should allow a simple end of 200,{} response with res.end()', function(done){

      this.xapp.get('/api', function(req,res) {
        res.end()
      })

      request.get('/api').end(function(err,res) {
        expect(res.statusCode).to.eql(200)
        expect(res.body).to.eql({})
        done()
      })

    })

    it('can return an object instead of res.send()', function(done){

      this.xapp.get('/', function(req,res) {
        return {
          just: 'the body'
        }
      })

      request.get('/api').end(function(err,res) {
        expect(res.statusCode).to.eql(200)
        expect(res.body).to.deep.equal({
          just: 'the body'
        })
        done()
      })

    })

    it('can return an array of [code: number, body: object, headers: object]', function(done){

      this.xapp.get('/', function(req,res) {
        return [
          201,
          { just: 'the body' },
          { 'x-cool': 'yeah' }
        ]
      })

      request.get('/api').end(function(err,res) {
        expect(res.statusCode).to.eql(201)
        expect(res.header['x-cool']).to.eql('yeah')
        expect(res.body).to.deep.equal({
          just: 'the body'
        })
        done()
      })

    })


  })

  describe('middleware', function(){

    it('should allow chaining', function(done){

      request.get('/some')
      .end(function(err, res){
        if(err) done(err)
      })

      this.xapp.use(function(req,res,next){
        res.body = {yup: true}
        next()
      })

      this.xapp.use(function(req,res){
        expect(res.body).to.deep.equal({yup: true})
        done()
      })

    })

    it('should allow multiple middleware as arguments', function(done){

      request.get('/some')
      .end(function(err, res){
        if(err) done(err)
      })

      this.xapp.use('/some'
        , function(req,res,next){

            res.body = {yes: true}
            next()

        }, function(req,res,next){

          res.body.yup = true
          next()

        },function(req,res,next) {
          expect(res.body).to.deep.equal({yes: true, yup: true})
          done()
        })

    })

    it.skip('can create a shortcut middleware by returning object for body', function(done){

      request.get('/').end(function(err, res){
        if (err) done(err)
        expect(res.body).to.deep.equal({hello: true})
        done()
      })

      this.xapp.get('/', {hello: true})

    })

  })

  describe('path matching', function(){

    it('should match a path', function(done){

      request.get('/right').end(function(err, res) {
        if(err && !res.statusCode) {done(err)}
        expect(res.statusCode).to.deep.equal(200)
        expect(res.body).to.deep.equal({hello: true})
        done()
      })

      this.xapp.use('/wrong', function(req,res,next){
        res.status(300).send({hello: false})
      })

      this.xapp.use('/right', function(req,res,next){
        res.status(200).send({hello: true})
      })

    })

    it('should match a full url', function(done){

      request.get('http://google.com/right').end(function(err, res) {
        if(err && !res.statusCode) {done(err)}
        expect(res.statusCode).to.deep.equal(200)
        expect(res.body).to.deep.equal({hello: true})
        done()
      })

      this.xapp.use('/wrong', function(req,res,next){
        res.status(300).send({hello: false})
      })

      this.xapp.use('http://google.com/right', function(req,res,next){
        res.status(200).send({hello: true})
      })

    })

    it('should match a regex expression', function(done){

      this.xapp.use(/\/josh[0-9]+/, function(req,res,next) {
        res.status(200).send({success: true})
      })

      request.get('/josh2').end(function(err,res) {
        if(err) done(err)
        expect(res.body).to.deep.equal({success: true})
        done()
      })

    })

    it('should match a method', function(done){

      request.put('/hello').end(function(err, res) {
        if(err && !res.statusCode) {done(err)}
        expect(res.statusCode).to.deep.equal(200)
        expect(res.body).to.deep.equal({hello: true})
        done()
      })

      this.xapp.use( '/hello', 'get', function(req,res,next ){
        res.status(400).send({hello: false})
      })

      this.xapp.use('/hello', 'put', function(req,res,next){
        res.status(200).send({hello: true})
      })

    })

    it('should have shortcut methods for ' + METHODS.join(','), function(done){

      var callers = []
      var self = this

      METHODS.forEach(function(method) {

        // Add listener
        self.xapp[method]('/api', function (req,res,next) {
          res.status(200).send({method: method+'-eh!'})
        })

        // Add "requester"
        callers.push(
          function(cb) {

            if(method === 'delete') method = 'del'
            if(method === 'options') return cb()

            request[method]('/api').end(function(err,res){
              if(err) done(err)
                expect(res.body).to.deep.equal({method: method+'-eh!'})
              cb()
            })

          }
        )
      })

      async.series(callers, done)

    })

  })

  describe('parameters', function(){

    it('should set parameters from express-like path', function(done){

      this.xapp.use('/some/:one/:two', function(req,res,next) {
        res.status(200).send(req.params)
      })

      request.get('/some/thing/todo', function(err,res) {
        if(err) done(err)
        expect(res.body).to.deep.equal({one: 'thing', two: 'todo'})
        done()
      })

    })

    it('should handle regexp params too', function(done){

      this.xapp.use(/\/one(two)(three)/, function(req,res,next) {
        res.status(200).send(req.params)
      })

      request.get('/onetwothree', function(err,res) {
        if(err) done(err)
        expect(res.body).to.deep.equal({0: 'two', 1: 'three'})
        done()
      })

    })

  })

  describe('query string', function(){

    it('should ignore query string in match, if not explicitly specified', function(done){

      this.xapp.use('/api', function(req,res,next) {
        expect(req.search).to.deep.equal('?one=1&two=2')
        res.end()
      })

      request('/api/one?one=1&two=2', function(err,res) {
        done()
      })

    })

    it('should match the query string as well, if explicitly set', function(done){

      this.xapp.use('/api?one=1', function(req,res,next) {
        return done(new Error('Should not match partial query strings'))
      })

      this.xapp.use('/api?one=1&two=2', function(req,res,next) {
        expect(req.search).to.deep.equal('?one=1&two=2')
        res.end()
      })

      request('/api?one=1&two=2', function(err,res) {
        done()
      })

    })

    it('should set req.query.x and have raw query in req.search', function(done){

      this.xapp.use('/api', function(req,res,next) {
        expect(req.query).to.deep.equal({one: '1', two: '2'})
        expect(req.search).to.deep.equal('?one=1&two=2')
        res.end()
      })

      request('/api?one=1&two=2', function(err,res) {
        done()
      })

    })


  })

  describe('headers', function(){

    it('should set headers in response', function(done){

      this.xapp.use(function(req,res,next) {
        res
        .set('Josh', 'is cool')
        .set({
          Hezz: 'is also cool'
        })
        .status(200)
        .send({})
      })

      request('/api', function(err,res) {
        if(err) { return done(err) }
        expect(res.header).to.have.property('josh')
        expect(res.header).to.have.property('hezz')
        expect(res.header.josh).to.equal('is cool')
        expect(res.header.hezz).to.equal('is also cool')
        done()
      })

    })

  })

  describe('body parsing', function(){

    it('should parse the body, if content-type == json', function(done){

      var self = this

      self.xapp.post('/json', function(req,res,next) {
        expect(req.body).to.deep.equal({json: true})
        res.status(200).end()
      })

      self.xapp.post('/str', function(req,res,next) {
        expect(req.body).to.deep.equal("{str: true}")
        res.status(200).end()
      })

      async.series([
        function (cb) {
          request.post('/json')
          .type('json')
          .send('{"json": true}')
          .end(cb)
        },
        function (cb) {
          request.post('/str')
          .send('{str: true}')
          .end(cb)
        }
      ],done)

    })

    it.skip('should bypass explicitly set paths/urls', function(done){

      this.xapp.bypass('/api')

      // Should not call this
      this.xapp.get('/api', function(req,res,next) {
        return {hello: true}
      })

      request.get('/api', function(err,res) {
        expect(res.statusCode).to.not.equal(200)
        expect(err+'').to.match(/ECONNREFUSED/)
        done()
      })

    })

  })

  describe('subsets of listeners', function(){
    it.skip('should allow a subset of the listeners to be reset/crud\'d', function(){
    })
    it.skip('should implement express 4.x .all', function(){
    })
  })

  describe.skip('implement (TODO)', function () {
    it('should have res.type(): json -> application/json', function(){
    })
    it('should have res.route(): independantly managed middleware', function(){
    })
    it('should have res.all(): path -> #get(fn), #put(fn), etc', function(){
    })
  })

})

