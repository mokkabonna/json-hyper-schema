var uriTemplates = require('uri-templates')
var util = require('./relative-json-pointer')
var pointer = require('json-pointer')

function resolve(template, link, instance) {
}

function isRelative(jsonPointer) {
  return /^\d+/.test(jsonPointer)
}

function getTemplateData(template, link, instance) {
  var parsedTemplate = uriTemplates(template)
  var templatePointers = link.templatePointers || {}
  var attachmentPointer = link.attachmentPointer || ''

  var result = parsedTemplate.varNames.reduce(function(all, name) {
    name = decodeURIComponent(name)
    var valuePointer

    if (templatePointers.hasOwnProperty(name)) {
      valuePointer = templatePointers[name]
      if (isRelative(valuePointer)) {
        try {
          all[name] = util.resolve(instance, attachmentPointer, valuePointer)
        } catch (e) {}
      } else {
        attemptSet()
      }
    } else {
      valuePointer = attachmentPointer + '/' + name
      attemptSet()
    }

    function attemptSet() {
      try {
        all[name] = pointer.get(instance, valuePointer)
      } catch (e) {}
    }

    return all
  }, {})

  return result
}

module.exports = {
  getTemplateData,
  resolve
}
