import { resolveRelativeJsonPointer } from './relative-json-pointer.js';
import uriTemplates from 'uri-templates';
import jsonPointer from 'json-pointer';

const isRelative = jsonPointer => /^\d+/.test(jsonPointer);
const has = Reflect.has;

/**
 *
 * Returns the data for a template given the provided link description object and instance data
 * @param {*} uriTemplate the uri template
 * @param {*} ldo the resolved "Link Description Object"
 * @param {*} instance the instance data
 * @returns
 */
function getTemplateData({ uriTemplate, ldo, instance }) {
  const parsedTemplate = uriTemplates(uriTemplate);
  const templatePointers = ldo.templatePointers ?? {};
  const attachmentPointer = ldo.attachmentPointer ?? '';

  const result = parsedTemplate.varNames.reduce(function (all, name) {
    name = decodeURIComponent(name);
    let valuePointer;

    if (has(templatePointers, name)) {
      valuePointer = templatePointers[name];
      if (isRelative(valuePointer)) {
        try {
          all[name] = resolveRelativeJsonPointer(
            instance,
            attachmentPointer,
            valuePointer
          );
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

export { getTemplateData };
