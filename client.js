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
  
  document.getElementById('newpcbutton').addEventListener('click', function() {
    var newpc = document.getElementById('newpc')
    var name = newpc.value
    if (name) {
      buff.addCharacter({id: name, type: 'PC'})
      newpc.value = ''
    }
  })
  
  document.getElementById('pclist').addEventListener('change', function() {
    document.getElementById('newpc').value = ''
    self.updatePCInfo()
  })
  
  document.getElementById('buffapplybtn').addEventListener('click', function() {
    var srclist = document.getElementById('bufflist')
    var pclist = document.getElementById('pclist')
    var item = srclist.value
    var pc = pclist.options[pclist.selectedIndex]
    if (item && pc && (self.sourcelist.indexOf(item) > -1))
      buff.applySourceToCharacter( item, pc.value )
    self.updatePCInfo()
  })
  
  document.getElementById('buffremovebtn').addEventListener('click', function() {
    var srclist = document.getElementById('bufflist')
    var item = srclist.value
    var pc = pclist.options[pclist.selectedIndex]
    if (item && pc)
      buff.removeSourceFromCharacter( item, pc.value )
    self.updatePCInfo()
  })
  
  document.getElementById('bufflist').addEventListener('typeahead', function() {
    var b = document.getElementById('bufflist')
    var bname = b.value
    self.displaySourceInfo(bname)
  })
  
  self.updatePCList()
  self.updateSourceList()
  self.updatePCInfo()
}


App.prototype.updatePCList = function() {
  var self = this
  var l = document.getElementById('pclist')
  var curr = l.options[l.selectedIndex].value
  l.innerHTML = '<option>--- Add New ---</option>'
  if (document.getElementById('newpc').value) {
    curr = document.getElementById('newpc').value
  }
  if (self.pcs) {
    self.pcs.forEach(function(v) {
      var item = l.appendChild(document.createElement('option'))
      if (curr == v.id) {
        item.setAttribute('selected', true)
      }
      item.innerHTML = v.id
    })
  }
  self.updatePCInfo()
}

App.prototype.updatePCInfo = function() {
  var pclist = document.getElementById('pclist')
  var txt = document.getElementById('pcinfo')
  txt.innerHTML = ''
  var pc = pclist.options[pclist.selectedIndex].value
  if (pc == '--- Add New ---') return
  var sources = buff.getAllSourceOnCharacter(pc)
  
  txt.innerHTML = 'Effects: ' + (sources.length ? sources.join(', ') : 'None') + '\n' + buff.showBonuses(pc).join('\n')
}

App.prototype.updateSourceList = function() {
  var self = this
  self.sourcelist = buff.getSourceList()
  var event = new CustomEvent('sourcelist', { 'detail': self.sourcelist })
  document.getElementById('bufflist').dispatchEvent(event)
}

App.prototype.displaySourceInfo = function(b) {
  var self = this
  var l = document.getElementById('sourcebuffs')
  l.innerHTML = ''
  var frag = document.createDocumentFragment()
  var buffs = self.doc.createSet('source', b)
  buffs.forEach(function(v) {
    var item = document.createElement('a')
    item.setAttribute('href', '#')
    item.setAttribute('class', 'list-group-item')
    item.innerHTML = numeral(v.get('amount')).format('+0') + ' ' + v.get('type') + ' bonus to ' + v.get('target')
    frag.appendChild(item)
  })
  l.appendChild(frag)
}

