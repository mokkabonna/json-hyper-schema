import uriTemplates from 'uri-templates';
import { extractSchemas } from './extract-sub-schema.js';
import Ajv from 'ajv';
import { getTemplateData } from './get-template-data.js';

const ajv = new Ajv();
const isFalse = s => s === false;
const has = Reflect.has;

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
  const templateData = getTemplateData(template, link, instance);
  const parsedTemplate = uriTemplates(template);

  if (link.hrefSchema === false || !has(link, 'hrefSchema')) {
    return {};
  }

  const defaultData = parsedTemplate.varNames.reduce(function (all, name) {
    const subSchema = extractSchemas(link.hrefSchema, '/properties/' + name);

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

export { getDefaultInputValues };
