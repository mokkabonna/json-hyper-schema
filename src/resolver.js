import uriTemplates from 'uri-templates';
import URI from 'uri-js';
import { extractSubSchemas } from './extract-sub-schema.js';

function createLink(ldo, instance, instanceUri, instancePointer, basesSoFar) {
  //FIXME

  const resolvedUri = basesSoFar.reduce(
    (base, uri) => URI.resolve(base, uri),
    instanceUri
  );

  const targetUri = URI.resolve(resolvedUri, ldo.href);

  const config = {
    contextPointer: instancePointer,
    targetUri,
    rel: ldo.rel,
    contextUri: instanceUri,
    attachmentPointer: instancePointer,
  };

  return config;
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
    return (schema.links ?? []).map(ldo => {
      let bases = basesSoFar;
      if (schema.base) {
        bases = [...basesSoFar, schema.base];
      }
      return createLink(ldo, instance, instanceUri, instancePointer, bases);
    });
  });

  return resolvedLinks;
}

function resolver({ schema, instance, instanceUri }) {
  //FIXME get all links from schema and subschemas, get only root for now
  const resolvedLinks = resolveRecursive(schema, instance, instanceUri, '');
  console.log(resolvedLinks);

  return {
    resolvedLinks,
  };
}

export { resolver };
