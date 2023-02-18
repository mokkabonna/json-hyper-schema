//convert all to import from statements
import uriTemplates from 'uri-templates';
import jsonPointer from 'json-pointer';
import traverseSchema from 'json-schema-traverse';
import URI from 'uri-js';
import { merge, omit } from 'lodash-es';
import { getTemplateData } from './get-template-data.js';
import { getDefaultInputValues } from './get-default-input-values.js';

const has = Reflect.has;

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

    // a function that will fill the href template with the provided data
    resolved.fillHref = function (userSupplied) {
      const fixedData = omit(
        getTemplateData(ldo.href, ldo, instance),
        Object.keys(resolved.hrefPrepopulatedInput)
      );
      // merge the user supplied data with the fixed data
      // prefer the fixed data
      const allData = merge({}, userSupplied, fixedData);
      const template = uriTemplates(ldo.href);
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
  const links = [];

  traverseSchema(
    schema,
    function (subSchema, pointer, root, parentPointer, parentKeyWord) {
      links.push(
        ...(subSchema.links || []).map(l =>
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
  const links = getAllSchemaLinks(schema);

  const resolvedLinks = links.reduce(function (all, config) {
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
export { resolveLinks };
