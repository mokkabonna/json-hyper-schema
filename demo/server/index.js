const express = require('express')
const bodyParser = require('body-parser')
const formatter = require('format-link-header')

const app = express()

app.use('/api/static', express.static('static'))
app.use(bodyParser.json())

var things = {
  elements: [
    {
      id: 12345,
      name: 'The biggest thing'
    }, {
      id: 67890,
      name: 'The most awesome thing'
    }
  ]
}

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

app.post('/api/things', function(req, res) {
  req.body.id = things.elements[things.elements.length - 1].id + 1
  things.elements.push(req.body)
  res.location('/api/things/' + req.body.id)
  res.status(201).send(req.body)
})

app.get('/api/things', function(req, res) {
  var links = {
    describedBy: {
      rel: 'describedBy',
      url: '/api/static/things.json'
    }
  }
  res.set('link', formatter(links))
  res.send(things)
})

app.get('/api/things/:id', function(req, res) {
  var links = {
    describedBy: {
      rel: 'describedBy',
      url: '/api/static/thing.json'
    }
  }
  res.set('link', formatter(links))

  var element = things.elements.find(e => e.id === parseInt(req.params.id))
  res.send(element)
})

module.exports = app
