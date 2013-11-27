var buff = require('bufftracker')()
var shoe = require('shoe')
var reconnect = require('reconnect')
var es = require('event-stream')
var through = require('through')
var moment = require('moment')
var numeral = require('numeral')

module.exports = App

function App() {
  var self = this
  if (!(self instanceof App)) return new App()
  self.doc = buff.doc
  self.pcs = self.doc.createSet('type', 'PC')
  self.srcs = self.doc.createSet(function(state) { return (state.source) })
}

App.prototype.setup = function() {
  var self = this
  var sourcelist = []
  var r = reconnect(function(stream) {
    var s = self.doc.createStream()
    s.pipe(stream).pipe(s)
  }).connect('/bufftracker')
  
  self.pcs.on('add', function() { self.updatePCList() })
  self.pcs.on('remove', function() { self.updatePCList() })
  
  self.srcs.on('add', function() { self.updateSourceList() })
  self.srcs.on('remove', function() { self.updateSourceList() })
  
  self.updatePCList()
  self.updateSourceList()
}

App.prototype.applyBuff = function(item, pc) {
  var self = this
  if (item && pc && (self.sourcelist.indexOf(item) > -1)) {
    console.log('apply: ' + item + ' to ' + pc)
    buff.applySourceToCharacter( item, pc )
  }
  self.updatePCInfo(pc)
}

App.prototype.removeBuff = function(item, pc) {
  var self = this
  if (item && pc)
    buff.removeSourceFromCharacter( item, pc )
  self.updatePCInfo(pc)
}

App.prototype.addPC = function() {
  var self = this
  var newpc = document.getElementById('newpc')
  var name = newpc.value
  if (name) {
    buff.addCharacter({id: name, type: 'PC'})
    newpc.value = ''
  }
}

App.prototype.updatePCList = function() {
  var self = this
  var l = document.getElementById('pclist')
  var curr = l.getElementsByClassName('active')[0]
  if (curr) curr = curr.dataset.pcId
  if (document.getElementById('newpc').value) {
    curr = document.getElementById('newpc').value
  }
  l.innerHTML = ''
  var frag = document.createDocumentFragment()
  if (self.pcs) {
    self.pcs.forEach(function(v) {
      var item = l.appendChild(document.createElement('a'))
      item.setAttribute('href', '#')
      item.dataset.pcId = v.id
      if (curr == v.id) {
        item.setAttribute('class', 'active list-group-item')
      } else {
        item.setAttribute('class', 'list-group-item')
      }
      item.innerHTML = v.id
    })
  }
  l.appendChild(frag)
  if (curr) self.updatePCInfo(curr)
}

App.prototype.updatePCInfo = function(pc) {
  var txt = document.getElementById('pcinfo')
  var currbuffs = document.getElementById('currentbuffs')
  txt.innerHTML = ''
  txt.innerHTML = buff.showBonuses(pc).join('\n')

  var sources = buff.getAllSourceOnCharacter(pc)
  currbuffs.innerHTML = ''
  var frag = document.createDocumentFragment()
  sources.forEach(function(v) {
    var item = frag.appendChild(document.createElement('li'))
    item.setAttribute('class', 'list-group-item small')
    item.innerHTML = v
  })
  currbuffs.appendChild(frag)
}

App.prototype.updateSourceList = function() {
  var self = this
  self.sourcelist = buff.getSourceList()
  var event = new CustomEvent('sourcelist', { 'detail': self.sourcelist })
  document.getElementById('bufflist').dispatchEvent(event)
}

App.prototype.getSourceInfo = function(b) {
  var self = this
  return self.doc.createSet('source', b)
}

App.prototype.updateBuff = function(b) {
  var self = this
  if (!b.id) {
    b.id = [b.source,b.type,b.target].join('|')
  }
  buff.updateBuff(b)
  self.updateSourceList()
}

App.prototype.deleteBuff = function(b) {
  var self = this
  buff.deleteBuff(b)
  self.updateSourceList()
}
