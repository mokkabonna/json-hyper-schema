const express = require('express')
const formatter = require('format-link-header')

const app = express()

app.use('/api/static', express.static('static'))

app.get('/api', function(req, res) {
  var links = {
    describedBy: {
      rel: 'describedBy',
      url: '/api/static/root.json'
    }
  }
  res.set('link', formatter(links))
  res.send({})
})

module.exports = app
