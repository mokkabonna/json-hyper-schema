## Forked from here: https://github.com/mokkabonna/json-hyper-schema

# json-hyper-schema [![Build Status](https://travis-ci.org/mokkabonna/json-hyper-schema.svg?branch=master)](https://travis-ci.org/mokkabonna/json-hyper-schema) [![Coverage Status](https://coveralls.io/repos/github/mokkabonna/json-hyper-schema/badge.svg?branch=master)](https://coveralls.io/github/mokkabonna/json-hyper-schema?branch=master)


> A javascript implementation of json hyper schema.

This is currently under heavy development, expect the API to change. The tests are probably the best description of the functionality so far. So here is the spec so far:

```
extract sub schema
  plain schema
    ✓ return a new schema the one sub schema
    - throws if not pointing to a subschema
  non property pointer
    ✓ extracts that schema
  not keyword
    ✓ extracts the not schema
  patternProperties
    ✓ includes the schema if allOf if matching the property name
  additionalProperties
    ✓ does not include the schema if matching properties or patternProperties
    ✓ does include the schema if not matching properties or patternProperties
    ✓ does include the schema if not matching properties or patternProperties
  dependencies
    ✓ considers
    - works with nested dependencies
  schemas in arrays
    ✓ extracts allOf
    ✓ extracts anyOf
    ✓ extracts oneOf
    ✓ extracts deeply nested ones

relative json pointer util
  resolve to value
    ✓ resolves 0
    ✓ resolves 1
    ✓ resolves 1/0
    ✓ resolves 1/highly/nested/objects
    ✓ does not throw if 0 value and root reference
    ✓ throws when trying to go above the root
    ✓ throws if trying to get key of root
    ✓ resolves 0/objects
  resolve to property name
    ✓ resolves to index in array
    ✓ resolves to property name

resolver
  getTemplateData
    ✓ returns empty object when no templated parts
    ✓ returns data from instance when templated
    ✓ returns empty if not existing in the template
    ✓ supports absolute templatePointers
    ✓ supports relative templatePointers
  getDefaultInputValues
    ✓ gets an object with the default values set
    ✓ does not include values if not valid (but sets undefined)
    ✓ excludes properties with with false set in subschema
    ✓ return empty object if no input allowed
  resolve
    ✓ resolves non templated uris
    ✓ resolves links with data from instance
    ✓ does not set targetUri when it cannot be used
    ✓ provides a function for fully templating the template and enforces prefilled values
    - considers base
    requires input
      ✓ resolves values that does not allow input
      ✓ allows overriding prepopulated input


37 passing (79ms)
3 pending

```


## Roadmap

- [x] Get template data from instance
- [x] Get default values for user input
- [x] Provide user input and template uri
- [ ] Support base keyword
- [ ] Support contextPointer
- [x] Relative json pointer util
- [x] Extract subschema util


## Utils

The following utils are currently in this repository, but will probably become their own package:

- relative-json-pointer: resolve relative json pointers according to https://tools.ietf.org/html/draft-handrews-relative-json-pointer-01

- extract-sub-schema: Extracts a new sub schema for one or more properties only
