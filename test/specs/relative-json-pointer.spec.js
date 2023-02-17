import { expect } from 'chai';
import { resolveRelativeJsonPointer } from '../../src/relative-json-pointer.js';

describe('relative json pointer util', function () {
  var data;
  beforeEach(function () {
    data = {
      foo: ['bar', 'baz'],
      highly: {
        nested: {
          objects: true,
          arrayinarray: [1, [11, 12], [3, 4, 5]],
        },
      },
    };
  });

  describe('resolve to value', function () {
    it('resolves 0 from root', function () {
      expect(resolveRelativeJsonPointer(data, '/', '0')).to.eql(data);
    });

    it('resolves 0', function () {
      expect(resolveRelativeJsonPointer(data, '/foo/1', '0')).to.eql('baz');
    });

    it('resolves 1', function () {
      expect(resolveRelativeJsonPointer(data, '/foo/1', '1')).to.eql([
        'bar',
        'baz',
      ]);
    });

    it('resolves 1/0', function () {
      expect(resolveRelativeJsonPointer(data, '/foo/1', '1/0')).to.eql('bar');
    });

    it('resolves 1/highly/nested/objects', function () {
      expect(
        resolveRelativeJsonPointer(data, '/foo/1', '2/highly/nested/objects')
      ).to.eql(true);
    });

    it('resolves from within array to sibling array in parent', () => {
      expect(
        resolveRelativeJsonPointer(data, '/highly/nested/arrayinarray/2/2', '0')
      ).to.eql(5, 'from 5 to itself');
      expect(
        resolveRelativeJsonPointer(
          data,
          '/highly/nested/arrayinarray/2/2',
          '1/1'
        )
      ).to.eql(4, 'from 5 to 4');

      expect(
        resolveRelativeJsonPointer(
          data,
          '/highly/nested/arrayinarray/2/2',
          '2/1/1'
        )
      ).to.eql(12, 'from 5 to 12');
    });

    it('does not throw if 0 value and root reference', function () {
      expect(resolveRelativeJsonPointer(data, '/', '0')).to.eql(data);
    });

    it('throws if with leading zeros', () => {
      expect(function () {
        resolveRelativeJsonPointer(data, '/foo', '01');
      }).to.throw(/invalid relative pointer/i);
    });

    it('throws if non number', () => {
      expect(function () {
        resolveRelativeJsonPointer(data, '/foo', 'd');
      }).to.throw(/invalid relative pointer/i);
    });

    it('throws when trying to go above the root', function () {
      expect(function () {
        resolveRelativeJsonPointer(data, '/', '1');
      }).to.throw(/trying to reference/i);

      expect(function () {
        resolveRelativeJsonPointer(data, '/foo/1', '3');
      }).to.throw(/trying to reference value above root/i);
    });

    it('throws if trying to get key of root', function () {
      expect(function () {
        resolveRelativeJsonPointer(data, '/', '0#');
      }).to.throw();
    });

    it('resolves 0/objects', function () {
      expect(
        resolveRelativeJsonPointer(data, '/highly/nested', '0/objects')
      ).to.eql(true);
    });
  });

  describe('resolve to property name', function () {
    it('resolves to index in array', function () {
      expect(resolveRelativeJsonPointer(data, '/foo/1', '0#')).to.eql(1);
    });

    it('resolves to property name', function () {
      expect(resolveRelativeJsonPointer(data, '/foo/1', '1#')).to.eql('foo');
      expect(resolveRelativeJsonPointer(data, '/highly/nested', '0#')).to.eql(
        'nested'
      );
      expect(resolveRelativeJsonPointer(data, '/highly/nested', '1#')).to.eql(
        'highly'
      );
    });
  });
});
