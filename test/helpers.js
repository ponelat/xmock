var expect = require('chai').expect
var helpers = require('../helpers')

describe('helpers', function() {

  describe('isFullUrl', function(){
    it('should return true for any regexp', function(){
      expect(helpers.isFullUrl(/reg/)).to.be.true
    })

    it('should return true for http://google.com', function(){
      expect(helpers.isFullUrl('http://google.com')).to.be.true
    })

    it('should return true for google.com', function(){
      expect(helpers.isFullUrl('google.com')).to.be.true
    })

    it('should return false for google', function(){
      expect(helpers.isFullUrl('google')).to.be.false
    })

    it('should return false for /api', function(){
      expect(helpers.isFullUrl('/api')).to.be.false
    })
  })

})


