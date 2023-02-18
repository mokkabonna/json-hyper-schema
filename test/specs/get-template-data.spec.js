import { expect } from 'chai';
import { getTemplateData } from '../../src/get-template-data.js';

describe('getTemplateData', function () {
  let link;

  beforeEach(function () {
    link = {
      rel: 'about',
      href: '/about',
    };
  });

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
