const chai = require('chai')
const extract = require('../../src/extract-sub-schema')
const expect = chai.expect

describe.only('extract sub schema', function() {

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

  describe('plain schema', function() {
    it('return a new schema the one sub schema', function() {
      var result = extract(schema, '/properties/name')
      expect(result).to.eql({minLength: 2})
    })
  })

  describe('not keyword', function() {
    it('extracts the not schema', function() {
      var result = extract({
        properties: schema.properties,
        not: {
          properties: {
            name: {
              maxLength: 5
            }
          }
        }
      }, '/properties/name')
      expect(result).to.eql({
        minLength: 2,
        not: {
          maxLength: 5
        }
      })
    })
  })

  describe('schemas in arrays', function() {
    it('extracts allOf', function() {
      var result = extract({
        properties: schema.properties,
        allOf: [
          {
            properties: {
              name: {
                maxLength: 5
              }
            }
          }
        ]
      }, '/properties/name')
      expect(result).to.eql({
        minLength: 2,
        allOf: [
          {
            maxLength: 5
          }
        ]
      })
    })

    it('extracts anyOf', function() {
      var result = extract({
        properties: schema.properties,
        anyOf: [
          {
            properties: {
              name: {
                maxLength: 5
              }
            }
          }
        ]
      }, '/properties/name')
      expect(result).to.eql({
        minLength: 2,
        anyOf: [
          {
            maxLength: 5
          }
        ]
      })
    })

    it('extracts oneOf', function() {
      var result = extract({
        properties: schema.properties,
        oneOf: [
          {
            properties: {
              name: {
                maxLength: 5
              }
            }
          }
        ]
      }, '/properties/name')
      expect(result).to.eql({
        minLength: 2,
        oneOf: [
          {
            maxLength: 5
          }
        ]
      })
    })

    it('extracts deeply nested ones', function() {
      var result = extract({
        properties: schema.properties,
        allOf: [
          {
            properties: {
              name: {
                maxLength: 5
              }
            },
            allOf: [
              {
                properties: {
                  name: {
                    pattern: '.+'
                  }
                }
              }, {
                properties: {
                  foo: true
                }
              }
            ]
          }
        ]
      }, '/properties/name')

      expect(result).to.eql({
        minLength: 2,
        allOf: [
          {
            maxLength: 5,
            allOf: [
              {
                pattern: '.+'
              }
            ]
          }
        ]
      })
    })
  })
})
