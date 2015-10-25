var expect = require('chai').expect
var xmock = require('../')
var request = require('superagent')
var fauxJax = require('faux-jax')
var async = require('async')

var xapp = xmock()

describe('xmock', function() {

  describe('basics', function(){
    it('should throw if no body', function(done){

      request.get('/api').end(function(err, res) {
        done(new Error('Should have thown an error'))
      })
      
      xapp.use(function(req,res,next){
        try {
          res.status(201).send('')
        } catch(e) {
          expect(e+'').to.equal('Error: No body provided in response')
          done()
        }

      })
      
    })

    it('should not have zombie middleware', function(done){

      xapp.use(function(req,res,next){
        res.status(201).send('...')
      })

      xapp.reset()

      request.get('/api').end(function(err, res) {
        if(err) {done(err)}
        expect(res.statusCode).to.deep.equal(202)
        done()
      })
      
      xapp.use(function(req,res,next){
        res.status(202).send({})
      })
      
    })

    it('should return a response', function(done){

      xapp.reset()

      request.get('/api').end(function(err, res) {
        if(err) {done(err)}
        expect(res.statusCode).to.deep.equal(201)
        expect(res.body).to.deep.equal({hello: true})
        done()
      })

      xapp.use(function(req,res,next){
        res.status(201).send({hello: true})
      })
      
    })

  })

  describe('middleware', function(){
    
    beforeEach(function(){
      xapp.reset()
    })

    it('should allow chaining', function(done){

      request.get('/some')
      .end(function(err, res){
        if(err) done(err)
      })

      xapp.use(function(req,res,next){
        res.body = {yup: true}
        next()
      })

      xapp.use(function(req,res){
        expect(res.body).to.deep.equal({yup: true})
        done()
      })

    })

    it('should allow multiple middleware as arguments', function(done){
      
      request.get('/some')
      .end(function(err, res){
        if(err) done(err)
      })

      xapp.use('/some' 
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
      xapp.reset()
    })

    it('should match a path', function(done){

      request.get('/right').end(function(err, res) {
        if(err && !res.statusCode) {done(err)}
        expect(res.statusCode).to.deep.equal(200)
        expect(res.body).to.deep.equal({hello: true})
        done()
      })

      xapp.use('/wrong', function(req,res,next){
        res.status(300).send({hello: false})
      })

      xapp.use('/right', function(req,res,next){
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

      xapp.use('/right', function(req,res,next){
        res.status(300).send({hello: false})
      })

      xapp.use('http://google.com/right', function(req,res,next){
        res.status(200).send({hello: true})
      })

    })

    it('should match a method', function(done){

      request.put('/hello').end(function(err, res) {
        if(err && !res.statusCode) {done(err)}
        expect(res.statusCode).to.deep.equal(200)
        expect(res.body).to.deep.equal({hello: true})
        done()
      })

      xapp.use( '/hello', 'get', function(req,res,next ){
        res.status(400).send({hello: false})
      })

      xapp.use('/hello', 'put', function(req,res,next){
        res.status(200).send({hello: true})
      })

    })

    it('should have shortcut methods for get,put,post,delete,options', function(done){

      var callers = []
      var methods = ['get', 'put', 'post', 'delete', 'options', 'patch'] 

      methods.forEach(function(method) {
        xapp[method]('/api', function (req,res,next) {
          res.status(200).send({method: method})
        })

        callers.push(
          function(cb) {

            if(method === 'delete') method = 'del'
            if(method === 'options') return cb()

            request[method]('/api').end(function(err,res){
              if(err) done(err)
                expect(res.body).to.deep.equal({method: method})
              cb()
            })

          }
        )
      })

      xapp.use('/api', function(req,res,next) {
        res.status(200).send({method: 'missing'})
      })

      async.series(callers, done)

    })


  })
})
