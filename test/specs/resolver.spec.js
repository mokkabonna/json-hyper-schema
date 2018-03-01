const chai = require('chai')
const resolver = require('../../src/resolver')
const expect = chai.expect

describe('resolver', function() {
  var link
  var data

  beforeEach(function() {
    link = {
      rel: 'about',
      href: '/about'
    }
    data = {}
  })

  describe('getTemplateData', function() {
    it('returns empty object when no templated parts', function() {
      var result = resolver.getTemplateData(link.href, link, data)
      expect(result).to.eql({})
    })

    it('returns data from instance when templated', function() {
      var result = resolver.getTemplateData('/products/{id%28}', {
        rel: 'self',
        href: 'notImportant'
      }, {'id(': 7})
      expect(result).to.eql({'id(': 7})
    })

    it('returns empty if not existing in the template', function() {
      var result = resolver.getTemplateData('/products/{id%28}', {
        rel: 'self',
        href: 'notImportant'
      }, {})
      expect(result).to.eql({})
    })

    it('supports absoute templatePointers', function() {
      var result = resolver.getTemplateData('/products/{id}', {
        rel: 'self',
        href: 'notImportant',
        templatePointers: {
          id: '/child/id'
        }
      }, {id: 8, child: {id: 9}})
      expect(result).to.eql({id: 9})
    })

    it('supports relative templatePointers', function() {
      var result = resolver.getTemplateData('/products/{id}', {
        rel: 'self',
        href: 'notImportant',
        templatePointers: {
          id: '0/child/id'
        }
      }, {id: 8, child: {id: 9}})
      expect(result).to.eql({id: 9})

      result = resolver.getTemplateData('/products/{id}', {
        rel: 'self',
        href: 'notImportant',
        attachmentPointer: '/child/id',
        templatePointers: {
          id: '2/child/id'
        }
      }, {id: 8, child: {id: 9}})
      expect(result).to.eql({id: 9})

      result = resolver.getTemplateData('/products/{id}', {
        rel: 'self',
        href: 'notImportant',
        attachmentPointer: '/child/id',
        templatePointers: {
          id: '2/id'
        }
      }, {id: 8, child: {id: 9}})
      expect(result).to.eql({id: 8})
    })
  })

  describe.skip('resolve', function() {
    it('resolves non templated uris', function() {
      var resolved = resolver.resolve(link.href, link, data)

      expect(resolved).to.eql('/resolved')
    })
  })
})
