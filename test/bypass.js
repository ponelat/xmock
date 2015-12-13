var expect = require('chai').expect
var xmock = require('../')
var request = require('superagent')

describe('bypass', function() {
  before(function(){

    xmock()
    .bypass('httpbin.org')
    .get('/somepath', function () {
      return {hi: 1}
    })

  })

  after(function(){
      xmock().restore()
  })

  it('should', function(done){

    request
    .get('/somepath')
    .end(function (err, res) {
      expect(res.body).to.eql({hi: 1})
      done(err)
    })

  })
  it('should also', function(done){
    this.timeout(10 * 1000)
    request
    .get('http://httpbin.org/ip')
    .end(function (err) {
      done(err)
    })
  })
})
