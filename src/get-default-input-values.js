import uriTemplates from 'uri-templates';
import { extractSubSchemas } from './extract-sub-schema.js';
import { getTemplateData } from './get-template-data.js';

const isFalse = s => s === false;
const has = Reflect.has;

/**
 * Checks all schemas if any is defined as false, then user input is not allowed
 */
function schemaAcceptsUserInput(schema) {
  if (schema === false) return false;
  if (Array.isArray(schema.allOf) && schema.allOf.some(isFalse)) return false;
  if (Array.isArray(schema.anyOf) && schema.anyOf.every(isFalse)) return false;
  if (Array.isArray(schema.oneOf) && schema.oneOf.every(isFalse)) return false;
  return true;
}

function getTemplateVariableInfoFromInstance(ldo, instance) {
  const parsedTemplate = uriTemplates(ldo.href);

  const templateData = getTemplateData({
    uriTemplate: ldo.href,
    ldo,
    instance,
  });

  const isRequired = name => (ldo.templateRequired ?? []).includes(name);

  // check if all template variables does not accept user input
  if (ldo.hrefSchema === false || !has(ldo, 'hrefSchema')) {
    return Object.fromEntries(
      parsedTemplate.varNames.map(name => {
        //fixme can varnames have multiple of same?

        const value = templateData[name];

        return [
          name,
          {
            value,
            isRequired: isRequired(name),
            acceptsUserInput: false,
            hasValueFromInstance: has(templateData, name),
          },
        ];
      })
    );
  }

  return Object.fromEntries(
    parsedTemplate.varNames.map(name => {
      const subSchema = extractSubSchemas(
        ldo.hrefSchema,
        '/properties/' + name
      );
      const value = templateData[name];

      return [
        name,
        {
          //fixme consider rename value to more descriptive like valueFromInstance
          value,
          isRequired: isRequired(name),
          acceptsUserInput: schemaAcceptsUserInput(subSchema),
          hasValueFromInstance: has(templateData, name),
        },
      ];
    })
  );
}

export { getTemplateVariableInfoFromInstance };
