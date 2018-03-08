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

app.get('/api/things', function(req, res) {
  var links = {
    describedBy: {
      rel: 'describedBy',
      url: '/api/static/things.json'
    }
  }
  res.set('link', formatter(links))
  res.send({
    elements: [
      {
        id: 12345,
        data: {}
      }, {
        id: 67890,
        data: {}
      }
    ]
  })
})

app.get('/api/things/:id', function(req, res) {
  var links = {
    describedBy: {
      rel: 'describedBy',
      url: '/api/static/thing.json'
    }
  }
  res.set('link', formatter(links))

  if (req.params.id === 12345) {
    res.send({id: 12345, data: {}})
  } else {
    res.send({id: 67890, data: {}})
  }
})

module.exports = app
