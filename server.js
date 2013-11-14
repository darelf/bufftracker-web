var buff = require('bufftracker')()
var shoe = require('shoe')
var es = require('event-stream')
var moment = require('moment')
var http = require('http')
var ecstatic = require('ecstatic')(__dirname + '/static')
var server = http.createServer(ecstatic)
server.listen(8080)

var doc = buff.doc
var fs = require('fs')
// A couple of sources
var sources = JSON.parse(fs.readFileSync('sources.json'))
// Import the sources
buff.applyFromSources(sources)

//This is for a kind of heartbeat thingy
var r = doc.set('SERVER', {type:"identification"})
setInterval(function() {
  r.set({value:moment().format()})
}, 10000)

var sock = shoe(function(stream) {
  stream.pipe(doc.createStream()).pipe(stream)
})
sock.install(server, '/bufftracker')


