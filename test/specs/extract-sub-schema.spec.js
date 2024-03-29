import { expect } from 'chai';
import { extractSubSchemas } from '../../src/extract-sub-schema.js';

describe('extract sub schema', function () {
  let schema;

  beforeEach(function () {
    schema = {
      properties: {
        name: {
          minLength: 2,
        },
      },
    };
  });

  describe('plain schema', function () {
    it('return a new schema the one sub schema', function () {
      const result = extractSubSchemas(schema, '/properties/name');
      expect(result).to.eql({ minLength: 2 });
    });

    it('throws if not pointing to a subschema');
  });

  describe('non property pointer', function () {
    it('extracts that schema', function () {
      const result = extractSubSchemas(
        {
          properties: schema.properties,
          additionalProperties: {
            maxLength: 5,
            allOf: [
              {
                pattern: '.+',
              },
            ],
          },
        },
        '/additionalProperties'
      );
      expect(result).to.eql({
        maxLength: 5,
        allOf: [
          {
            pattern: '.+',
          },
        ],
      });
    });
  });

  describe('not keyword', function () {
    it('extracts the not schema', function () {
      const result = extractSubSchemas(
        {
          properties: schema.properties,
          not: {
            properties: {
              name: {
                maxLength: 5,
              },
            },
          },
        },
        '/properties/name'
      );
      expect(result).to.eql({
        minLength: 2,
        not: {
          maxLength: 5,
        },
      });
    });
  });

  describe('patternProperties', function () {
    it('includes the schema if allOf if matching the property name', function () {
      const result = extractSubSchemas(
        {
          properties: schema.properties,
          patternProperties: {
            'na.e': {
              maxLength: 5,
            },
            'n..e': {
              pattern: '.+',
            },
            notMe: false,
          },
        },
        '/properties/name'
      );

      expect(result).to.eql({
        minLength: 2,
        allOf: [
          {
            maxLength: 5,
          },
          {
            pattern: '.+',
          },
        ],
      });
    });
  });

  describe('additionalProperties', function () {
    it('does not include the schema if matching properties or patternProperties', function () {
      const result = extractSubSchemas(
        {
          properties: schema.properties,
          patternProperties: {
            'na.e': {
              maxLength: 5,
            },
            notMe: false,
          },
          additionalProperties: {
            pattern: '.+',
          },
        },
        '/properties/name'
      );

      expect(result).to.eql({
        minLength: 2,
        allOf: [
          {
            maxLength: 5,
          },
        ],
      });
    });

    it('does include the schema if not matching properties or patternProperties', function () {
      const result = extractSubSchemas(
        {
          properties: schema.properties,
          patternProperties: {
            'na.e': {
              maxLength: 5,
            },
            notMe: false,
          },
          additionalProperties: {
            pattern: '.+',
          },
        },
        '/properties/foo'
      );

      expect(result).to.eql({
        allOf: [
          {
            pattern: '.+',
          },
        ],
      });
    });

    it('does include the schema if not matching properties or patternProperties', function () {
      const result = extractSubSchemas(
        {
          properties: schema.properties,
          patternProperties: {
            'na.e': {
              maxLength: 5,
            },
            notMe: false,
          },
          additionalProperties: false,
        },
        '/properties/foo'
      );

      expect(result).to.eql({ allOf: [false] });
    });
  });

  describe('dependentSchemas', function () {
    it('considers ', function () {
      const result = extractSubSchemas(
        {
          properties: schema.properties,
          dependentSchemas: {
            other: {
              properties: {
                name: {
                  maxLength: 7,
                },
              },
            },
          },
        },
        '/properties/name',
        { presentKeys: ['other'] }
      );

      expect(result).to.eql({
        minLength: 2,
        allOf: [
          {
            maxLength: 7,
          },
        ],
      });
    });

    it('works with nested dependencies');
  });

  describe('schemas in arrays', function () {
    it('extracts allOf', function () {
      const result = extractSubSchemas(
        {
          properties: schema.properties,
          allOf: [
            {
              properties: {
                name: {
                  maxLength: 5,
                },
              },
            },
          ],
        },
        '/properties/name'
      );
      expect(result).to.eql({
        minLength: 2,
        allOf: [
          {
            maxLength: 5,
          },
        ],
      });
    });

    it('extracts anyOf', function () {
      const result = extractSubSchemas(
        {
          properties: schema.properties,
          anyOf: [
            {
              properties: {
                name: {
                  maxLength: 5,
                },
              },
            },
          ],
        },
        '/properties/name'
      );
      expect(result).to.eql({
        minLength: 2,
        anyOf: [
          {
            maxLength: 5,
          },
        ],
      });
    });

    it('extracts oneOf', function () {
      const result = extractSubSchemas(
        {
          properties: schema.properties,
          oneOf: [
            {
              properties: {
                name: {
                  maxLength: 5,
                },
              },
            },
          ],
        },
        '/properties/name'
      );
      expect(result).to.eql({
        minLength: 2,
        oneOf: [
          {
            maxLength: 5,
          },
        ],
      });
    });

    it('extracts deeply nested ones', function () {
      const result = extractSubSchemas(
        {
          properties: schema.properties,
          allOf: [
            {
              properties: {
                name: {
                  maxLength: 5,
                },
              },
              allOf: [
                {
                  properties: {
                    name: {
                      pattern: '.+',
                    },
                  },
                },
                {
                  properties: {
                    foo: true,
                  },
                },
              ],
            },
          ],
        },
        '/properties/name'
      );

      expect(result).to.eql({
        minLength: 2,
        allOf: [
          {
            maxLength: 5,
            allOf: [
              {
                pattern: '.+',
              },
            ],
          },
        ],
      });
    });
  });
});
