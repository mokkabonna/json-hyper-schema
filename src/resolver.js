const uriTemplates = require('uri-templates')
const util = require('./relative-json-pointer')
const extractSubSchema = require('./extract-sub-schema')
const pointer = require('json-pointer')
const Ajv = require('ajv')

const ajv = new Ajv()

function resolve(template, link, instance) {}

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

function anyIsFalse(schema) {
  if (schema === false) {
    return true
  }

  if (Array.isArray(schema.allOf) && schema.allOf.some(s => s === false)) {
    return true
  }

  if (Array.isArray(schema.anyOf) && schema.anyOf.every(s => s === false)) {
    return true
  }

  if (Array.isArray(schema.oneOf) && schema.oneOf.every(s => s === false)) {
    return true
  }

  return false
}

function getDefaultInputValues(template, link, instance) {
  var templateData = getTemplateData(template, link, instance)
  var parsedTemplate = uriTemplates(template)

  if (link.hrefSchema === false || !link.hasOwnProperty('hrefSchema')) {
    return {}
  }

  var defaultData = parsedTemplate.varNames.reduce(function(all, name) {
    var subSchema = extractSubSchema(link.hrefSchema, '/properties/' + name)

    if (!anyIsFalse(subSchema)) {
      all[name] = undefined
    }

    if (ajv.validate(subSchema, templateData[name])) {
      all[name] = templateData[name]
    }

    return all
  }, {})

  return defaultData
}

module.exports = {
  getDefaultInputValues,
  getTemplateData,
  resolve
}
