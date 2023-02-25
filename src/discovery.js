import uriTemplates from 'uri-templates';
import URI from 'uri-js';
import { extractSubSchemas } from './extract-sub-schema.js';
import { getTemplateVariableInfoFromInstance } from './get-default-input-values.js';

const normalizeArray = arr => (Array.isArray(arr) ? arr : [arr]);

function createLinks(ldo, instance, instanceUri, instancePointer, basesSoFar) {
  //FIXME
  // const resolvedUri = basesSoFar.reduce(
  //   (base, uri) => URI.resolve(base, uri),
  //   instanceUri
  // );

  // const templatedUri = uriTemplates(ldo.href).fillFromObject(instance);
  // const targetUri = URI.resolve(resolvedUri, templatedUri);

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

function resolveRecursive(
  schema,
  instance,
  instanceUri,
  instancePointer,
  basesSoFar = []
) {
  const subSchema = extractSubSchemas(schema, instancePointer);
  const schemas = flattenSchemas(subSchema);

  const resolvedLinks = schemas.flatMap(schema => {
    return (schema.links ?? []).flatMap(ldo => {
      let bases = basesSoFar;
      if (schema.base) {
        bases = [...basesSoFar, schema.base];
      }
      return createLinks(ldo, instance, instanceUri, instancePointer, bases);
    });
  });

  return resolvedLinks;
}

function discoverLinks({ schema, instance, instanceUri }) {
  //FIXME get all links from schema and subschemas, get only root for now
  const resolvedLinks = resolveRecursive(schema, instance, instanceUri, '');

  return {
    resolvedLinks,
  };
}

export { discoverLinks };
