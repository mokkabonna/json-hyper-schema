//convert all to import from statements
import uriTemplates from 'uri-templates';
import { resolve } from './relative-json-pointer.js';
import { extractSchemas } from './extract-sub-schema.js';
import jsonPointer from 'json-pointer';
import traverse from 'json-schema-traverse';
import URI from 'uri-js';
import Ajv from 'ajv';
import { merge, omit } from 'lodash-es';

const has = Reflect.has;

const ajv = new Ajv();

const isRelative = jsonPointer => /^\d+/.test(jsonPointer);
const isFalse = s => s === false;

function getTemplateData(template, link, instance) {
  var parsedTemplate = uriTemplates(template);
  var templatePointers = link.templatePointers || {};
  var attachmentPointer = link.attachmentPointer || '';

  var result = parsedTemplate.varNames.reduce(function (all, name) {
    name = decodeURIComponent(name);
    var valuePointer;

    if (has(templatePointers, name)) {
      valuePointer = templatePointers[name];
      if (isRelative(valuePointer)) {
        try {
          all[name] = resolve(instance, attachmentPointer, valuePointer);
        } catch (e) {
          // Ignore for now
        }
      } else {
        attemptSet();
      }
    } else {
      valuePointer = attachmentPointer + '/' + name;
      attemptSet();
    }

    function attemptSet() {
      try {
        all[name] = jsonPointer.get(instance, valuePointer);
      } catch (e) {
        // Ignore for now
      }
    }

    return all;
  }, {});

  return result;
}

function simplify(schema) {
  if (schema === false) {
    return false;
  }

  if (Array.isArray(schema.allOf) && schema.allOf.some(isFalse)) {
    return false;
  }

  if (Array.isArray(schema.anyOf) && schema.anyOf.every(isFalse)) {
    return false;
  }

  if (Array.isArray(schema.oneOf) && schema.oneOf.every(isFalse)) {
    return false;
  }

  return schema;
}

function getDefaultInputValues(template, link, instance) {
  var templateData = getTemplateData(template, link, instance);
  var parsedTemplate = uriTemplates(template);

  if (link.hrefSchema === false || !has(link, 'hrefSchema')) {
    return {};
  }

  var defaultData = parsedTemplate.varNames.reduce(function (all, name) {
    var subSchema = extractSchemas(link.hrefSchema, '/properties/' + name);

    if (simplify(subSchema) !== false) {
      all[name] = undefined;
    }

    if (ajv.validate(subSchema, templateData[name])) {
      all[name] = templateData[name];
    }

    return all;
  }, {});

  return defaultData;
}

function resolveLink(config, instance, instanceUri, attachmentPointer) {
  let ldo = config.ldo;
  let resolved = {
    contextUri: instanceUri,
    contextPointer: '',
    rel: ldo.rel,
    attachmentPointer: attachmentPointer || '',
    ldo: ldo,
  };

  if (has(ldo, 'hrefSchema') && ldo.hrefSchema !== false) {
    resolved.hrefInputTemplates = [ldo.href];
    resolved.hrefPrepopulatedInput = getDefaultInputValues(
      ldo.href,
      ldo,
      instance
    );
    resolved.hrefFixedInput = omit(
      getTemplateData(ldo.href, ldo, instance),
      Object.keys(resolved.hrefPrepopulatedInput)
    );

    resolved.fillHref = function (userSupplied) {
      var fixedData = omit(
        getTemplateData(ldo.href, ldo, instance),
        Object.keys(resolved.hrefPrepopulatedInput)
      );
      var allData = merge({}, userSupplied, fixedData);
      var template = uriTemplates(ldo.href);
      resolved.targetUri = template.fill(allData);
      return resolved.targetUri;
    };
  } else {
    let template = uriTemplates(ldo.href);
    let uri;

    if (template.varNames.length) {
      if (template.varNames.every(n => has(instance, n))) {
        uri = template.fill(instance);
      }
    } else {
      uri = ldo.href;
    }

    if (uri !== undefined) {
      resolved.targetUri = URI.resolve(instanceUri, uri);
    }
  }

  return resolved;
}

function createLink(ldo, pointer, parentPointer, parentKeyWord) {
  return {
    parentKeyWord,
    lastPointer: pointer.split('/').pop(),
    schemaPointer: pointer || '',
    parentPointer: parentPointer || '',
    ldo: ldo,
  };
}

function getAllSchemaLinks(schema) {
  var links = [];

  traverse(
    schema,
    function (subSchema, pointer, root, parentPointer, parentKeyWord) {
      links = links.concat(
        (subSchema.links || []).map(l =>
          createLink(l, pointer, parentPointer, parentKeyWord)
        )
      );
    }
  );

  return links;
}

function schemaToInstancePointer(pointer) {
  return pointer.split('/properties/').join('/').split('/items/').join('/');
}

function resolveLinks(schema, instance, instanceUri) {
  var links = getAllSchemaLinks(schema);

  var resolvedLinks = links.reduce(function (all, config) {
    if (config.parentKeyWord === 'items' && config.lastPointer !== 'items') {
      let dataPointer = schemaToInstancePointer(config.schemaPointer);
      all.push(
        resolveLink(
          config,
          jsonPointer(instance, dataPointer),
          instanceUri,
          dataPointer
        )
      );
    } else if (config.lastPointer === 'items') {
      let dataPointer = schemaToInstancePointer(config.parentPointer);
      let arr = jsonPointer(instance, dataPointer);
      if (Array.isArray(arr)) {
        all = all.concat(
          arr.map((instanceData, i) =>
            resolveLink(
              config,
              instanceData,
              instanceUri,
              dataPointer + '/' + i
            )
          )
        );
      }
    } else {
      all.push(resolveLink(config, instance, instanceUri, ''));
    }
    return all;
  }, []);
  return resolvedLinks;
}
export { getDefaultInputValues, getTemplateData, resolveLinks };
