const chai = require('chai')
const resolver = require('../../src/resolver')
const expect = chai.expect

describe('resolver', function() {
  it('resolves non templated uris', function() {
    var link = {
      rel: 'about',
      href: '/about'
    }
    var data = {}
    var resolved = resolver.resolve(link.href, link, data)

    expect(resolved).to.eql('/resolved')
  })
})
