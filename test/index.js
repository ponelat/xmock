var expect = require('chai').expect
var xmock = require('../')
var request = require('superagent')
var fauxJax = require('faux-jax')

var xapp = xmock()

describe('xmock', function() {

  // beforeEach(function(){
  //   fauxJax.removeAllListeners()
  // })

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


  })
})

