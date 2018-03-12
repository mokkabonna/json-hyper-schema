const uriTemplates = require('uri-templates')
const util = require('./relative-json-pointer')
const extractSubSchema = require('./extract-sub-schema')
const jsonPointer = require('json-pointer')
const traverse = require('json-schema-traverse')
const URI = require('uri-js')
const Ajv = require('ajv')
const omit = require('lodash/omit')
const merge = require('lodash/merge')

const ajv = new Ajv()

const isRelative = jsonPointer => /^\d+/.test(jsonPointer)
const isFalse = s => s === false

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
        all[name] = jsonPointer.get(instance, valuePointer)
      } catch (e) {}
    }

    return all
  }, {})

  return result
}

function simplify(schema) {
  if (schema === false) {
    return false
  }

  if (Array.isArray(schema.allOf) && schema.allOf.some(isFalse)) {
    return false
  }

  if (Array.isArray(schema.anyOf) && schema.anyOf.every(isFalse)) {
    return false
  }

  if (Array.isArray(schema.oneOf) && schema.oneOf.every(isFalse)) {
    return false
  }

  return schema
}

function getDefaultInputValues(template, link, instance) {
  var templateData = getTemplateData(template, link, instance)
  var parsedTemplate = uriTemplates(template)

  if (link.hrefSchema === false || !link.hasOwnProperty('hrefSchema')) {
    return {}
  }

  var defaultData = parsedTemplate.varNames.reduce(function(all, name) {
    var subSchema = extractSubSchema(link.hrefSchema, '/properties/' + name)

    if (simplify(subSchema) !== false) {
      all[name] = undefined
    }

    if (ajv.validate(subSchema, templateData[name])) {
      all[name] = templateData[name]
    }

    return all
  }, {})

  return defaultData
}

function resolveLink(config, instance, instanceUri, attachmentPointer) {
  let ldo = config.ldo
  let resolved = {
    contextUri: instanceUri,
    contextPointer: '',
    rel: ldo.rel,
    attachmentPointer: attachmentPointer || ''
  }

  if (ldo.hasOwnProperty('hrefSchema') && ldo.hrefSchema !== false) {
    resolved.hrefInputTemplates = [ldo.href]
    resolved.hrefPrepopulatedInput = getDefaultInputValues(ldo.href, ldo, instance)
    resolved.hrefFixedInput = omit(getTemplateData(ldo.href, ldo, instance), Object.keys(resolved.hrefPrepopulatedInput))

    resolved.fillHref = function(userSupplied) {
      var fixedData = omit(getTemplateData(ldo.href, ldo, instance), Object.keys(resolved.hrefPrepopulatedInput))
      var allData = merge({}, userSupplied, fixedData)
      var template = uriTemplates(ldo.href)
      resolved.targetUri = template.fill(allData)
      return resolved.targetUri
    }
  } else {
    let template = uriTemplates(ldo.href)
    let uri

    if (template.varNames.length) {
      if (template.varNames.every(n => instance.hasOwnProperty(n))) {
        uri = template.fill(instance)
      }
    } else {
      uri = ldo.href
    }

    if (uri !== undefined) {
      resolved.targetUri = URI.resolve(instanceUri, uri)
    }
  }

  return resolved
}

function createLink(ldo, pointer, parentPointer) {
  return {
    lastPointer: pointer.split('/').pop(),
    schemaPointer: pointer,
    parentPointer: parentPointer,
    ldo: ldo
  }
}

function getAllSchemaLinks(schema) {
  var links = []

  traverse(schema, function(subSchema, pointer, root, parentPointer) {
    links = links.concat((subSchema.links || []).map(l => createLink(l, pointer, parentPointer)))
  })

  return links
}

function schemaToInstancePointer(pointer) {
  return pointer.split('/').filter(p => p !== 'properties').join('/')
}

function resolve(schema, instance, instanceUri) {
  var links = getAllSchemaLinks(schema)

  var resolvedLinks = links.reduce(function(all, config) {
    if (config.lastPointer === 'items') {
      var dataPointer = schemaToInstancePointer(config.parentPointer)
      let arr = jsonPointer(instance, dataPointer)
      if (Array.isArray(arr)) {
        all = all.concat(arr.map((instanceData, i) => resolveLink(config, instanceData, instanceUri, dataPointer + '/' + i)))
      }
    } else {
      all.push(resolveLink(config, instance, instanceUri))
    }
    return all
  }, [])

  return resolvedLinks
}

module.exports = {
  getDefaultInputValues,
  getTemplateData,
  resolve
}
