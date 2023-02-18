// convert to imports
import pointer from 'json-pointer';
import { isPlainObject, attempt, merge, reduce } from 'lodash-es';

const isNotEmptyObject = o => isPlainObject(o) && Object.keys(o).length > 0;
const isRestrictingSchema = s => isNotEmptyObject(s) || s === false;
const has = (o, name) => Reflect.has(o, name);
const isArray = Array.isArray;

function extractSchemas(schema, jsonPointer, options) {
  options = options || {};
  const tokens = pointer.parse(jsonPointer);
  const lastToken = tokens[tokens.length - 1];
  const newSchema = {};
  const hasPatternProperty = false;

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
          return extractSchemas(arraySchema, jsonPointer);
        })
        .filter(isRestrictingSchema);
    }
  });

  if (has(schema, 'not')) {
    newSchema.not = extractSchemas(schema.not, jsonPointer);
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

  if (has(schema, 'dependencies') && isArray(options.presentKeys)) {
    const dependencySchemas = options.presentKeys.reduce(function (all, key) {
      if (has(schema.dependencies, key)) {
        all.push(extractSchemas(schema.dependencies[key], jsonPointer));
      }
      return all;
    }, []);

    newSchema.allOf = (newSchema.allOf || []).concat(dependencySchemas);
  }

  return newSchema;
}

export { extractSchemas };
