import { extractSubSchemas } from './extract-sub-schema.js';
import { getTemplateVariableInfoFromInstance } from './get-default-input-values.js';

const normalizeArray = arr => (Array.isArray(arr) ? arr : [arr]);

function createLinks(ldo, instance, instanceUri, instancePointer, basesSoFar) {
  const defaultInputValues = getTemplateVariableInfoFromInstance(ldo, instance);
  const relNormalized = normalizeArray(ldo.rel);

  const configs = relNormalized.map(rel => ({
    contextPointer: instancePointer,
    rel,
    contextUri: instanceUri,
    attachmentPointer: instancePointer,
    hrefInputTemplates: [ldo.href, ...basesSoFar],
    templateVariableInfo: defaultInputValues,
  }));

  return configs;
}

// for now just the root schema
function flattenSchemas(rootSchema) {
  return [rootSchema];
}

function discoverRecursive(
  schema,
  instance,
  instanceUri,
  instancePointer = '',
  basesSoFar = []
) {
  const subSchema = extractSubSchemas(schema, instancePointer);
  const schemas = flattenSchemas(subSchema);

  const discoveredLinks = schemas.flatMap(schema => {
    return (schema.links ?? []).flatMap(ldo => {
      let bases = basesSoFar;
      if (schema.base) {
        bases = [...basesSoFar, schema.base];
      }
      return createLinks(ldo, instance, instanceUri, instancePointer, bases);
    });
  });

  return discoveredLinks;
}

function discoverLinks({ schema, instance, instanceUri }) {
  //FIXME get all links from schema and subschemas, get only root for now
  const discoveredLinks = discoverRecursive(schema, instance, instanceUri);

  return {
    discoveredLinks,
  };
}

export { discoverLinks };
