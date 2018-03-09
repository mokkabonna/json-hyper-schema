const chai = require('chai')
const extract = require('../../src/schema-applies-to')
const expect = chai.expect

describe('schema applies to', function() {
  var schema

  beforeEach(function() {
    schema = {
      properties: {
        name: {
          minLength: 2
        }
      }
    }
  })
  
  it('returns a map of json pointers to array of schema json pointers')

})
