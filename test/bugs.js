var expect = require('chai').expect
var xmock = require('../')
var request = require('superagent')
var fauxJax = require('faux-jax')
var async = require('async')

var tooManyListeners = 4

describe('xmock - bugs', function() {

  describe('listeners', function() {

    before(function(){
      var self = this
      this.events = {}
      fauxJax.setMaxListeners(tooManyListeners-1)
      fauxJax.on('newListener', function(ev) { self.events[ev] = true })
      this.xapp = xmock()
    })

    after(function(){
      this.xapp.restore()
    })

    beforeEach(function(){
      this.xapp.reset()
    })

    it('should not leak listeners', function(done){

      var events = this.events
      var requests = []
      for (var i = 0; i < tooManyListeners; i++) {

        this.xapp.use(function(req,res,next){
          res.status(200).send({})
        })

        requests.push(
          function (cb) {
            request.get('/something', function(err,res) {
              if(err) done(err)
                expect(res.ok).to.equal(true)
              cb()
            })
          }
        )

      }

      function listenerCheck(cb) {
        for(var ev in events) {
          var len = fauxJax.listeners(ev).length
          expect(len).to.be.below(tooManyListeners, 'too many "'+ev+'" listeners')
        }
        cb()
      }

      async.series(requests.concat([listenerCheck]), done)

    })

    it('.restore() should be idempotent', function(done){
      this.xapp.restore()
      this.xapp.restore()
      this.xapp.restore()

      request.get('/').end(function(err,res) {
        expect(err.code).to.eql('ECONNREFUSED')
        done()
      })

    })

  })

})
