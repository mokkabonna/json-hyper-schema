var uriTemplates = require('uri-templates')
var pointer = require('json-pointer')

function resolve(template, link, instance) {
  var defaultData = defaultTemplateData(template, link, instance)
}

function getTemplateData(template, link, instance) {
  var parsedTemplate = uriTemplates(template)
  var result = parsedTemplate.varNames.reduce(function(all, name) {
    name = decodeURIComponent(name)
    if (instance[name] !== undefined) {
      all[name] = instance[name]
    }
    return all
  }, {})

  return result
}

module.exports = {
  getTemplateData,
  resolve
}
