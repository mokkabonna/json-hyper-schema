import { expect } from 'chai';
import {
  resolveLinks,
  getTemplateData,
  getDefaultInputValues,
} from '../../src/resolver.js';
import _ from 'lodash';

describe('resolver', function () {
  let link;
  let data;

  beforeEach(function () {
    link = {
      rel: 'about',
      href: '/about',
    };
    data = {};
  });

  describe('getTemplateData', function () {
    it('returns empty object when no templated parts', function () {
      const result = getTemplateData({
        uriTemplate: link.href,
        ldo: link,
        instance: {},
      });
      expect(result).to.eql({});
    });

    it('returns data from instance when templated', function () {
      const result = getTemplateData({
        uriTemplate: '/products/{id%28}',
        ldo: {
          rel: 'self',
          href: 'notImportant',
        },
        instance: {
          'id(': 7,
        },
      });
      expect(result).to.eql({
        'id(': 7,
      });
    });

    it('returns empty if not existing in the template', function () {
      const result = getTemplateData({
        uriTemplate: '/products/{id%28}',
        ldo: {
          rel: 'self',
          href: 'notImportant',
        },
        instance: {},
      });
      expect(result).to.eql({});
    });

    it('supports absolute templatePointers', function () {
      const result = getTemplateData({
        uriTemplate: '/products/{id}',
        ldo: {
          rel: 'self',
          href: 'notImportant',
          templatePointers: {
            id: '/child/id',
          },
        },
        instance: {
          id: 8,
          child: {
            id: 9,
          },
        },
      });
      expect(result).to.eql({
        id: 9,
      });
    });

    it('returns all values', () => {
      const result = getTemplateData({
        uriTemplate: '/products/{id}/child/{childId}',
        ldo: {
          rel: 'self',
          href: 'notImportant',
          templatePointers: {
            childId: '/child/id',
          },
        },
        instance: {
          id: 8,
          child: {
            id: 9,
          },
        },
      });

      expect(result).to.eql({
        id: 8,
        childId: 9,
      });
    });

    it('supports relative templatePointers', function () {
      let result = getTemplateData({
        uriTemplate: '/products/{id}',
        ldo: {
          rel: 'self',
          href: 'notImportant',
          templatePointers: {
            id: '0/child/id',
          },
        },
        instance: {
          id: 8,
          child: {
            id: 9,
          },
        },
      });
      expect(result).to.eql({
        id: 9,
      });

      result = getTemplateData({
        uriTemplate: '/products/{id}',
        ldo: {
          rel: 'self',
          href: 'notImportant',
          attachmentPointer: '/child/arr/2',
          templatePointers: {
            id: '3/child/id',
          },
        },
        instance: {
          id: 8,
          child: {
            id: 9,
            arr: [1, 2, 3],
          },
        },
      });
      expect(result).to.eql({
        id: 9,
      });

      result = getTemplateData({
        uriTemplate: '/products/{id}',
        ldo: {
          rel: 'self',
          href: 'notImportant',
          attachmentPointer: '/child/arr/2',
          templatePointers: {
            id: '1/1',
          },
        },
        instance: {
          id: 8,
          child: {
            id: 9,
            arr: [1, 2, 3],
          },
        },
      });
      expect(result).to.eql({
        id: 2,
      });

      result = getTemplateData({
        uriTemplate: '/products/{id}',
        ldo: {
          rel: 'self',
          href: 'notImportant',
          attachmentPointer: '/child/id',
          templatePointers: {
            id: '2/id',
          },
        },
        instance: {
          id: 8,
          child: {
            id: 9,
          },
        },
      });
      expect(result).to.eql({
        id: 8,
      });
    });
  });

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

  describe('resolve with simple schema', function () {
    let schema;
    beforeEach(function () {
      schema = {
        $id: 'https://schema.example.com/entry',
        $schema: 'http://json-schema.org/draft-07/hyper-schema#',
        base: 'https://api.example.com/',
        links: [
          {
            rel: 'self',
            href: '',
          },
          {
            rel: 'about',
            href: '/docs',
          },
        ],
      };
    });

    describe('not accepting input', function () {
      it('resolves non templated uris', function () {
        const resolved = resolveLinks(schema, data, 'https://api.example.com');

        expect(resolved).to.eql([
          {
            contextUri: 'https://api.example.com',
            contextPointer: '',
            rel: 'self',
            targetUri: 'https://api.example.com/',
            attachmentPointer: '',
          },
          {
            contextUri: 'https://api.example.com',
            contextPointer: '',
            rel: 'about',
            targetUri: 'https://api.example.com/docs',
            attachmentPointer: '',
          },
        ]);
      });

      it('resolves links with data from instance if not accepting input', function () {
        const resolved = resolveLinks(
          {
            links: [
              {
                rel: 'author',
                href: '/authors/{author}',
              },
            ],
          },
          {
            author: 'Martin',
          },
          'https://example.com'
        );

        expect(resolved).to.eql([
          {
            contextUri: 'https://example.com',
            contextPointer: '',
            rel: 'author',
            targetUri: 'https://example.com/authors/Martin',
            attachmentPointer: '',
          },
        ]);
      });

      it('does not set targetUri when it cannot be used', function () {
        const resolved = resolveLinks(
          {
            links: [
              {
                rel: 'author',
                href: '/authors/{author}/{extra}',
              },
            ],
          },
          {
            author: 'Martin',
          },
          'https://example.com'
        );

        expect(resolved).to.eql([
          {
            contextUri: 'https://example.com',
            contextPointer: '',
            rel: 'author',
            attachmentPointer: '',
          },
        ]);
      });

      it('considers base');
    });

    describe('accepting input', function () {
      it('resolves values that does not allow input', function () {
        const resolved = resolveLinks(
          {
            links: [
              {
                rel: 'author',
                href: '/authors/{author}/{extra}',
                hrefSchema: {
                  properties: {
                    author: false,
                    extra: true,
                  },
                },
              },
            ],
          },
          {
            author: 'Martin',
          },
          'https://example.com'
        );

        expect(resolved.map(o => _.omit(o, 'fillHref'))).to.eql([
          {
            contextUri: 'https://example.com',
            contextPointer: '',
            rel: 'author',
            attachmentPointer: '',
            hrefInputTemplates: ['/authors/{author}/{extra}'],
            hrefFixedInput: {
              author: 'Martin',
            },
            hrefPrepopulatedInput: {
              extra: undefined,
            },
          },
        ]);
      });

      it('allows overriding prepopulated input', function () {
        const resolved = resolveLinks(
          {
            links: [
              {
                rel: 'author',
                href: '/authors/{author}/{extra}',
                hrefSchema: {
                  properties: {
                    author: true,
                    extra: true,
                  },
                },
              },
            ],
          },
          {
            author: 'Martin',
          },
          'https://example.com'
        );

        expect(resolved.map(o => _.omit(o, 'fillHref'))).to.eql([
          {
            contextUri: 'https://example.com',
            contextPointer: '',
            rel: 'author',
            attachmentPointer: '',
            hrefInputTemplates: ['/authors/{author}/{extra}'],
            hrefFixedInput: {},
            hrefPrepopulatedInput: {
              author: 'Martin',
              extra: undefined,
            },
          },
        ]);
      });

      it('provides a function for fully templating the template', function () {
        const resolved = resolveLinks(
          {
            links: [
              {
                rel: 'author',
                href: '/authors/{author}/{extra}',
                hrefSchema: {
                  properties: {
                    author: true,
                    extra: true,
                  },
                },
              },
            ],
          },
          {
            author: 'Martin',
          },
          'https://example.com'
        );

        expect(resolved[0].fillHref).to.be.a('function');
      });

      it('does not allow input if schema is false', function () {
        const resolved = resolveLinks(
          {
            links: [
              {
                rel: 'author',
                href: '/authors/{author}/{extra}',
                hrefSchema: {
                  properties: {
                    author: false,
                    extra: true,
                  },
                },
              },
            ],
          },
          {
            author: 'Martin',
          },
          'https://example.com'
        );

        expect(resolved[0].fillHref).to.be.a('function');

        const targetUri = resolved[0].fillHref({
          author: 'I should not be used',
          extra: 'I should be used',
        });

        expect(targetUri).to.equal(
          '/authors/Martin/' + encodeURIComponent('I should be used')
        );
        expect(targetUri).to.equal(resolved[0].targetUri);
      });
    });
  });

  describe('resolve with subschema links', function () {
    let schema;
    let data;
    beforeEach(function () {
      schema = {
        type: 'object',
        required: ['elements'],
        properties: {
          elements: {
            type: 'array',
            items: {
              links: [
                {
                  anchorPointer: '',
                  rel: 'item',
                  href: 'things/{id}',
                },
              ],
            },
          },
        },
        links: [
          {
            rel: 'self',
            href: '',
          },
        ],
      };

      data = {
        elements: [
          {
            id: 12345,
            data: {},
          },
          {
            id: 67890,
            data: {},
          },
        ],
      };
    });

    it('resolves item links', function () {
      const resolved = resolveLinks(
        schema,
        data,
        'https://api.example.com/things'
      );

      expect(resolved).to.eql([
        {
          contextUri: 'https://api.example.com/things',
          contextPointer: '',
          rel: 'self',
          targetUri: 'https://api.example.com/things',
          attachmentPointer: '',
        },
        {
          contextUri: 'https://api.example.com/things',
          contextPointer: '',
          rel: 'item',
          targetUri: 'https://api.example.com/things/12345',
          attachmentPointer: '/elements/0',
        },
        {
          contextUri: 'https://api.example.com/things',
          contextPointer: '',
          rel: 'item',
          targetUri: 'https://api.example.com/things/67890',
          attachmentPointer: '/elements/1',
        },
      ]);
    });

    it('resolves when item is array', function () {
      schema = {
        type: 'object',
        required: ['elements'],
        properties: {
          elements: {
            type: 'array',
            items: [
              {
                links: [
                  {
                    anchorPointer: '',
                    rel: 'item',
                    href: 'things/{id}',
                  },
                ],
              },
            ],
          },
        },
        links: [
          {
            rel: 'self',
            href: '',
          },
        ],
      };

      const resolved = resolveLinks(
        schema,
        data,
        'https://api.example.com/things'
      );

      expect(resolved).to.eql([
        {
          contextUri: 'https://api.example.com/things',
          contextPointer: '',
          rel: 'self',
          targetUri: 'https://api.example.com/things',
          attachmentPointer: '',
        },
        {
          contextUri: 'https://api.example.com/things',
          contextPointer: '',
          rel: 'item',
          targetUri: 'https://api.example.com/things/12345',
          attachmentPointer: '/elements/0',
        },
      ]);
    });
  });
});
