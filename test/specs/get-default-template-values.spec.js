import { expect } from 'chai';
import _ from 'lodash';
import { getDefaultInputValues } from '../../src/get-default-input-values.js';

describe('getDefaultInputValues', function () {
  it('gets an object with the default values set', function () {
    const result = getDefaultInputValues(
      '/products/{id}',
      {
        rel: 'self',
        href: 'notImportant',
        hrefSchema: {
          properties: {
            id: {
              type: 'integer',
              minimum: 1,
            },
          },
        },
      },
      {
        id: 1,
      }
    );

    expect(result).to.eql({
      id: 1,
    });
  });

  it('does not include values if not valid (but sets undefined)', function () {
    const result = getDefaultInputValues(
      '/products/{id}',
      {
        rel: 'self',
        href: 'notImportant',
        hrefSchema: {
          properties: {
            id: {
              type: 'integer',
              minimum: 1,
            },
          },
        },
      },
      {
        id: 0,
      }
    );

    expect(result).to.eql({
      id: undefined,
    });
  });

  it('excludes properties with with false set in subschema', function () {
    let result = getDefaultInputValues(
      '/products/{id}',
      {
        rel: 'self',
        href: '/products/{id}',
        hrefSchema: {
          properties: {
            id: false,
          },
        },
      },
      {
        id: 0,
      }
    );

    expect(result).to.eql({});

    result = getDefaultInputValues(
      '/products/{id}',
      {
        rel: 'self',
        href: '/products/{id}',
        hrefSchema: {
          properties: {
            id: true,
          },
          allOf: [
            {
              properties: {
                id: false,
              },
            },
          ],
        },
      },
      {
        id: 0,
      }
    );

    expect(result).to.eql({});
  });

  it('return empty object if no input allowed', function () {
    const result = getDefaultInputValues(
      '/products/{id}',
      {
        rel: 'self',
        href: '/products/{id}',
        hrefSchema: false,
      },
      {
        id: 0,
      }
    );

    expect(result).to.eql({});
  });
});
