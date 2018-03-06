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
      }, {
        'id(': 7
      })
      expect(result).to.eql({
        'id(': 7
      })
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
      }, {
        id: 8,
        child: {
          id: 9
        }
      })
      expect(result).to.eql({
        id: 9
      })
    })

    it('supports relative templatePointers', function() {
      var result = resolver.getTemplateData('/products/{id}', {
        rel: 'self',
        href: 'notImportant',
        templatePointers: {
          id: '0/child/id'
        }
      }, {
        id: 8,
        child: {
          id: 9
        }
      })
      expect(result).to.eql({
        id: 9
      })

      result = resolver.getTemplateData('/products/{id}', {
        rel: 'self',
        href: 'notImportant',
        attachmentPointer: '/child/id',
        templatePointers: {
          id: '2/child/id'
        }
      }, {
        id: 8,
        child: {
          id: 9
        }
      })
      expect(result).to.eql({
        id: 9
      })

      result = resolver.getTemplateData('/products/{id}', {
        rel: 'self',
        href: 'notImportant',
        attachmentPointer: '/child/id',
        templatePointers: {
          id: '2/id'
        }
      }, {
        id: 8,
        child: {
          id: 9
        }
      })
      expect(result).to.eql({
        id: 8
      })
    })
  })

  describe('getDefaultInputValues', function() {
    it('gets an object with the default values set', function() {
      var result = resolver.getDefaultInputValues('/products/{id}', {
        rel: 'self',
        href: 'notImportant',
        hrefSchema: {
          properties: {
            id: {
              type: 'integer',
              minimum: 1
            }
          }
        }
      }, {
        id: 1
      })

      expect(result).to.eql({
        id: 1
      })
    })

    it('does not include values if not valid (but sets undefined)', function() {
      var result = resolver.getDefaultInputValues('/products/{id}', {
        rel: 'self',
        href: 'notImportant',
        hrefSchema: {
          properties: {
            id: {
              type: 'integer',
              minimum: 1
            }
          }
        }
      }, {
        id: 0
      })

      expect(result).to.eql({
        id: undefined
      })
    })

    it('excludes properties with with false set in subschema', function() {
      var result = resolver.getDefaultInputValues('/products/{id}', {
        rel: 'self',
        href: '/products/{id}',
        hrefSchema: {
          properties: {
            id: false
          }
        }
      }, {
        id: 0
      })

      expect(result).to.eql({})

      result = resolver.getDefaultInputValues('/products/{id}', {
        rel: 'self',
        href: '/products/{id}',
        hrefSchema: {
          properties: {
            id: true
          },
          allOf: [{
            properties: {
              id: false
            }
          }]
        }
      }, {
        id: 0
      })

      expect(result).to.eql({})
    })

    it('return empty object if no input allowed', function() {
      var result = resolver.getDefaultInputValues('/products/{id}', {
        rel: 'self',
        href: '/products/{id}',
        hrefSchema: false
      }, {
        id: 0
      })

      expect(result).to.eql({})
    })
  })

  describe('resolve', function() {
    var schema = {
      $id: 'https://schema.example.com/entry',
      $schema: 'http://json-schema.org/draft-07/hyper-schema#',
      base: 'https://api.example.com/',
      links: [{
        rel: 'self',
        href: ''
      }, {
        rel: 'about',
        href: '/docs'
      }]
    }

    it('resolves non templated uris', function() {
      var resolved = resolver.resolve(schema, data, 'https://api.example.com')

      expect(resolved).to.eql([{
        contextUri: 'https://api.example.com',
        contextPointer: '',
        rel: 'self',
        targetUri: 'https://api.example.com/',
        attachmentPointer: ''
      }, {
        contextUri: 'https://api.example.com',
        contextPointer: '',
        rel: 'about',
        targetUri: 'https://api.example.com/docs',
        attachmentPointer: ''
      }])
    })

    it('resolves links with data from instance', function() {
      var resolved = resolver.resolve({
        links: [{
          rel: 'author',
          href: '/authors/{author}'
        }]
      }, {
        author: 'Martin'
      }, 'https://example.com')

      expect(resolved).to.eql([{
        contextUri: 'https://example.com',
        contextPointer: '',
        rel: 'author',
        targetUri: 'https://example.com/authors/Martin',
        attachmentPointer: ''
      }])
    })

    it('does not set targetUri when it cannot be used', function() {
      var resolved = resolver.resolve({
        links: [{
          rel: 'author',
          href: '/authors/{author}/{extra}'
        }]
      }, {
        author: 'Martin'
      }, 'https://example.com')

      expect(resolved).to.eql([{
        contextUri: 'https://example.com',
        contextPointer: '',
        rel: 'author',
        attachmentPointer: ''
      }])
    })

    describe('requires input', function() {
      it('resolves values that does not allow input', function() {
        var resolved = resolver.resolve({
          links: [{
            rel: 'author',
            href: '/authors/{author}/{extra}',
            hrefSchema: {
              properties: {
                author: false,
                extra: true
              }
            }
          }]
        }, {
          author: 'Martin'
        }, 'https://example.com')

        expect(resolved).to.eql([{
          contextUri: 'https://example.com',
          contextPointer: '',
          rel: 'author',
          attachmentPointer: '',
          hrefInputTemplates: [
            '/authors/{author}/{extra}'
          ],
          hrefFixedInput: {
            author: 'Martin'
          },
          hrefPrepopulatedInput: {
            extra: undefined
          }
        }])
      })

      it('allows overriding prepopulated input', function() {
        var resolved = resolver.resolve({
          links: [{
            rel: 'author',
            href: '/authors/{author}/{extra}',
            hrefSchema: {
              properties: {
                author: true,
                extra: true
              }
            }
          }]
        }, {
          author: 'Martin'
        }, 'https://example.com')

        expect(resolved).to.eql([{
          contextUri: 'https://example.com',
          contextPointer: '',
          rel: 'author',
          attachmentPointer: '',
          hrefInputTemplates: [
            '/authors/{author}/{extra}'
          ],
          hrefFixedInput: {},
          hrefPrepopulatedInput: {
            author: 'Martin',
            extra: undefined
          }
        }])
      })
    })

    it('provides a function for fully templating the template')
    it('does not allow changing the hrefFixedInput')

    it('considers base')
  })
})
