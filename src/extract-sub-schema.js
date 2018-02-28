const pointer = require('json-pointer')
const _ = require('lodash')

const isRestrictingSchema = s => (_.isPlainObject(s) && Object.keys(s).length > 0) || s === false

module.exports = function extractSchemas(schema, jsonPointer) {
  var tokens = pointer.parse(jsonPointer)
  var lastToken = tokens[tokens.length - 1]
  var secondToLast = tokens[tokens.length - 2]
  var newSchema = {}

  _.attempt(function() {
    _.merge(newSchema, pointer.get(schema, jsonPointer))
  })

  var schemaArrays = ['allOf', 'oneOf', 'anyOf']

  schemaArrays.forEach(function(name) {
    if (schema.hasOwnProperty(name)) {
      newSchema[name] = schema[name].map(function(arraySchema) {
        return extractSchemas(arraySchema, jsonPointer)
      }).filter(isRestrictingSchema)
    }
  })

  if (schema.hasOwnProperty('not')) {
    newSchema.not = extractSchemas(schema.not, jsonPointer)
  }

  if (schema.hasOwnProperty('patternProperties')) {
    var patternSchemas = _.reduce(schema.patternProperties, function(all, schema, key) {
      if (new RegExp(key).test(lastToken)) {
        all.push(schema)
      }
      return all
    }, [])

    if (patternSchemas.length) {
      newSchema.allOf = (newSchema.allOf || []).concat(patternSchemas)
    }
  }

  return newSchema
}
