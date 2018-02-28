const pointer = require('json-pointer')
const _ = require('lodash')

const isRestrictingSchema = s => (_.isPlainObject(s) && Object.keys(s).length > 0) || s === false

module.exports = function extractSchemas(schema, jsonPointer) {
  var newSchema = {}

  _.attempt(function() {
    _.merge(newSchema, pointer.get(schema, jsonPointer))
  })

  var schemaArrays = ['allOf', 'oneOf', 'anyOf']

  schemaArrays.forEach(function(name) {
    if (schema[name]) {
      newSchema[name] = schema[name].map(function(arraySchema) {
        return extractSchemas(arraySchema, jsonPointer)
      }).filter(isRestrictingSchema)
    }
  })

  return newSchema
}
