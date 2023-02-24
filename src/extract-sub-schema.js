// convert to imports
import pointer from 'json-pointer';
import { isPlainObject, attempt, merge, reduce } from 'lodash-es';

const isNotEmptyObject = o => isPlainObject(o) && Object.keys(o).length > 0;
const isRestrictingSchema = s => isNotEmptyObject(s) || s === false;
const has = Reflect.has;
const isArray = Array.isArray;

/**
 * Extracts all schemas that applies to a particular point in the schema
 * Iterates over allOf, anyOf and oneOf and construct a new schema that contains all schemas for the given jsonPointer
 * @param {*} schema
 * @param {*} jsonPointer
 * @param {*} options
 * @returns
 */
function extractSubSchemas(schema, jsonPointer, options) {
  options = options || {};
  const tokens = pointer.parse(jsonPointer);
  const lastToken = tokens[tokens.length - 1];
  let newSchema = {};
  let hasPatternProperty = false;

  attempt(function () {
    const subSchema = pointer.get(schema, jsonPointer);
    if (subSchema === false) {
      newSchema = false;
    } else {
      merge(newSchema, subSchema);
    }
  });

  const hasPlainProperty = isNotEmptyObject(newSchema);

  const schemaArrays = ['allOf', 'oneOf', 'anyOf'];

  schemaArrays.forEach(function (name) {
    if (has(schema, name)) {
      newSchema[name] = schema[name]
        .map(function (arraySchema) {
          return extractSubSchemas(arraySchema, jsonPointer);
        })
        .filter(isRestrictingSchema);
    }
  });

  if (has(schema, 'not')) {
    newSchema.not = extractSubSchemas(schema.not, jsonPointer);
  }

  if (has(schema, 'patternProperties')) {
    const patternSchemas = reduce(
      schema.patternProperties,
      function (all, schema, key) {
        if (new RegExp(key).test(lastToken)) {
          all.push(schema);
        }
        return all;
      },
      []
    );

    if (patternSchemas.length) {
      hasPatternProperty = true;
      newSchema.allOf = (newSchema.allOf || []).concat(patternSchemas);
    }
  }

  if (
    has(schema, 'additionalProperties') &&
    !hasPlainProperty &&
    !hasPatternProperty
  ) {
    newSchema.allOf = (newSchema.allOf || []).concat(
      schema.additionalProperties
    );
  }

  // finds all dependent schemas that are applies if keys are present in the instance
  // FIXME need to probably have the full instance, as we need to walk the same tree to find what keys are actually present
  if (has(schema, 'dependentSchemas') && isArray(options.presentKeys)) {
    const dependencySchemas = options.presentKeys.reduce(function (all, key) {
      if (has(schema.dependencySchemas, key)) {
        all.push(extractSubSchemas(schema.dependencySchemas[key], jsonPointer));
      }
      return all;
    }, []);

    newSchema.allOf = (newSchema.allOf || []).concat(dependencySchemas);
  }

  return newSchema;
}

export { extractSubSchemas };
