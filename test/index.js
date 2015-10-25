var expect = require('chai').expect
var xmock = require('../')
var request = require('superagent')
var fauxJax = require('faux-jax')
var async = require('async')

var METHODS = ['get', 'put', 'post', 'delete', 'options', 'patch']

describe('xmock', function() {

  before(function(){
    this.xapp = xmock()
  })

  after(function(){
    this.xapp.reset()
  })

  beforeEach(function(){
    this.xapp.reset()
  })

  describe('basics', function(){
    it('should throw if no body', function(done){

      request.get('/api').end(function(err, res) {
        done(new Error('Should have thown an error'))
      })

      this.xapp.use(function(req,res,next){
        try {
          res.status(201).send('')
        } catch(e) {
          expect(e+'').to.equal('Error: No body provided in response')
          done()
        }

      })

    })

    it('should not have zombie middleware', function(done){

      this.xapp.use(function(req,res,next){
        res.status(201).send('...')
      })

      this.xapp.reset()

      request.get('/api').end(function(err, res) {
        if(err) {done(err)}
        expect(res.statusCode).to.deep.equal(202)
        done()
      })

      this.xapp.use(function(req,res,next){
        res.status(202).send({})
      })

    })

    it('should return a response', function(done){

      this.xapp.reset()

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
      this.xapp.restore()

      request.get('/api').end(function(err, res) {
        if(err) {
          return tryRequest()
        }
        done(new Error('Expected a ECONNREFUSED'))
      })

      function tryRequest() {
        self.xapp.install()

        self.xapp.use(function(req,res,next) {
          res.status(200).send({})
        })

        request.get('/api').end(function(err, res) {
          if(err) { return done(err) }
          expect(res.ok).to.equal(true)
          done()
        })
      }


    })

  })

  describe('middleware', function(){

    beforeEach(function(){
      this.xapp.reset()
    })

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

  })

  describe('path matching', function(){

    beforeEach(function(){
      this.xapp.reset()
    })

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

      this.xapp.use('/right', function(req,res,next){
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

    beforeEach(function(){
      this.xapp.reset()
    })

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

  describe('subsets of listeners', function(){
    it.skip('should allow a subset of the listeners to be reset/crud\'d', function(){
    })
  })

})

