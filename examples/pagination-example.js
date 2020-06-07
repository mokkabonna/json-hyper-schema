const hyper = require('../src/resolver');
const _ = require('lodash');

const instanceData = {
  elements: [
    { id: 12345, data: {} },
    { id: 67890, data: {} },
  ],
  meta: {
    prev: {
      offset: 100,
      limit: 100,
    },
    current: {
      offset: 200,
      limit: 100,
      order: ['id DESC'],
      where: { foo: 1 },
    },
    next: {
      offset: 300,
      limit: 100,
    },
  },
};

const paginationSchema = {
  required: ['elements', 'meta'],
  properties: {
    elements: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
          },
          data: {
            type: 'object',
          },
        },
      },
    },
    meta: {
      type: 'object',
      required: ['current', 'next'],
      properties: {
        prev: { $ref: '#/definitions/pagination' },
        current: { $ref: '#/definitions/pagination' },
        next: { $ref: '#/definitions/pagination' },
      },
    },
  },
  links: [
    {
      rel: 'self',
      href: 'things{?offset,limit}',
      templateRequired: ['offset', 'limit', 'order'],
      templatePointers: {
        offset: '/meta/current/offset',
        limit: '/meta/current/limit',
        order: '/meta/current/order',
        where: '/meta/current/where',
      },
      targetSchema: { $ref: '#' },
    },
    {
      rel: 'prev',
      href: 'things{?offset,limit}',
      templateRequired: ['offset', 'limit'],
      templatePointers: {
        offset: '/meta/prev/offset',
        limit: '/meta/prev/limit',
      },
      targetSchema: { $ref: '#' },
    },
    {
      rel: 'next',
      href: 'things{?offset,limit}',
      templateRequired: ['offset', 'limit'],
      templatePointers: {
        offset: '/meta/next/offset',
        limit: '/meta/next/limit',
      },
    },
  ],
  definitions: {
    pagination: {
      type: 'object',
      required: ['offset', 'limit'],
      properties: {
        offset: {
          type: 'integer',
          minimum: 0,
          default: 0,
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 1011110,
          default: 10,
        },
      },
    },
  },
};




const resolved = hyper.resolve(paginationSchema, instanceData, 'https://api.example.com');
const links = resolved.map((link) => _.omit(link, ['ldo']));

console.log(JSON.stringify(links, null, 2));
