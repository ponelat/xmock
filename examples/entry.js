var xmock = require('./')
var request = require('superagent')

var xapp = xmock()

xapp.get('/yay', function(req,res,next) {
  res.status(200).send({whoop: 'whoop'})
})

request.get('/yay', function(err,res) {
  if(err) console.error(err)
  console.log(res.body)
})
