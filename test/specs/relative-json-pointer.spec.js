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
        },
      },
    };
  });

  describe('resolve to value', function () {
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

    it('does not throw if 0 value and root reference', function () {
      expect(resolveRelativeJsonPointer(data, '/', '0')).to.eql(data);
    });

    it('throws when trying to go above the root', function () {
      expect(function () {
        resolveRelativeJsonPointer(data, '/', '1');
      }).to.throw();

      expect(function () {
        resolveRelativeJsonPointer(data, '/foo/1', '3');
      }).to.throw();
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
