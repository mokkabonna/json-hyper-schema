import { expect } from 'chai';
import _ from 'lodash';
import { getTemplateVariableInfoFromInstance } from '../../src/get-default-input-values.js';

describe.only('getTemplateVariableInfoFromInstance', function () {
  it('returns no value if not in instance', function () {
    const result = getTemplateVariableInfoFromInstance(
      {
        href: '/products/{id}',
        templateRequired: ['id'],
      },
      {}
    );

    expect(result).to.eql({
      id: {
        value: undefined,
        isRequired: true,
        hasValueFromInstance: false,
        acceptsUserInput: false,
      },
    });
  });

  it('sets properties as not accepting user input if no hrefSchema or set to false', () => {
    const result = getTemplateVariableInfoFromInstance(
      {
        href: '/products/{id}',
      },
      {
        id: 1,
      }
    );

    expect(result).to.eql({
      id: {
        value: 1,
        isRequired: false,
        hasValueFromInstance: true,
        acceptsUserInput: false,
      },
    });

    const result2 = getTemplateVariableInfoFromInstance(
      {
        href: '/products/{id}',
        hrefSchema: false,
      },
      {
        id: 1,
      }
    );

    expect(result2).to.eql({
      id: {
        value: 1,
        isRequired: false,
        hasValueFromInstance: true,
        acceptsUserInput: false,
      },
    });
  });

  it('sets properties as not accepting user input if one property is false', () => {
    const result = getTemplateVariableInfoFromInstance(
      {
        href: '/products/{id}',
        templateRequired: ['id'],
        hrefSchema: {
          properties: {
            id: false,
          },
        },
      },
      {
        id: 2,
      }
    );

    expect(result).to.eql({
      id: {
        value: 2,
        isRequired: true,
        hasValueFromInstance: true,
        acceptsUserInput: false,
      },
    });
  });

  it('works with patternproperties', () => {
    const result = getTemplateVariableInfoFromInstance(
      {
        href: '/products/{id}',
        hrefSchema: {
          patternProperties: {
            '.*': false,
          },
        },
      },
      {
        id: 2,
      }
    );

    expect(result).to.eql({
      id: {
        value: 2,
        isRequired: false,
        hasValueFromInstance: true,
        acceptsUserInput: false,
      },
    });
  });

  it('works with normal properties, patternproperties and additionalProperties', () => {
    const result = getTemplateVariableInfoFromInstance(
      {
        href: '/products/{extra}/{123}/{a}/{b}',
        hrefSchema: {
          a: {
            type: 'string',
          },
          b: false,
          patternProperties: {
            '^\\d+$': false,
          },
          additionalProperties: false,
        },
      },
      {
        a: 2,
        b: 8,
        123: 3,
        extra: 9,
      }
    );

    expect(result).to.eql({
      a: {
        value: 2,
        isRequired: false,
        hasValueFromInstance: true,
        acceptsUserInput: false,
      },
      b: {
        value: 8,
        isRequired: false,
        hasValueFromInstance: true,
        acceptsUserInput: false,
      },
      123: {
        value: 3,
        isRequired: false,
        hasValueFromInstance: true,
        acceptsUserInput: false,
      },
      extra: {
        value: 9,
        isRequired: false,
        hasValueFromInstance: true,
        acceptsUserInput: false,
      },
    });
  });
});
