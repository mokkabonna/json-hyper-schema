import { expect } from 'chai';
import { resolveLinks } from '../../src/resolver.js';
import _ from 'lodash';

describe('resolver', function () {
  let data;

  beforeEach(function () {
    data = {};
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
