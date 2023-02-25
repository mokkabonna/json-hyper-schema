# json-hyper-schema ![example workflow](https://github.com/mokkabonna/json-hyper-schema/actions/workflows/test.yml/badge.svg) [![codecov](https://codecov.io/gh/mokkabonna/json-hyper-schema/branch/master/graph/badge.svg?token=3MhxT65dCW)](https://codecov.io/gh/mokkabonna/json-hyper-schema)

> A javascript implementation of json hyper schema.

This is currently under heavy development, expect the API to change. The tests are probably the best description of the functionality so far. So here is the spec so far:

```
  extract sub schema
    plain schema
      ✔ return a new schema the one sub schema
      - throws if not pointing to a subschema
    non property pointer
      ✔ extracts that schema
    not keyword
      ✔ extracts the not schema
    patternProperties
      ✔ includes the schema if allOf if matching the property name
    additionalProperties
      ✔ does not include the schema if matching properties or patternProperties
      ✔ does include the schema if not matching properties or patternProperties
      ✔ does include the schema if not matching properties or patternProperties
    dependentSchemas
      ✔ considers
      - works with nested dependencies
    schemas in arrays
      ✔ extracts allOf
      ✔ extracts anyOf
      ✔ extracts oneOf
      ✔ extracts deeply nested ones

  getTemplateVariableInfoFromInstance
    ✔ returns no value if not in instance
    ✔ sets properties as not accepting user input if no hrefSchema or set to false
    ✔ sets properties as not accepting user input if one property is false
    ✔ works with patternproperties
    ✔ works with normal properties, patternproperties and additionalProperties

  getTemplateData
    ✔ returns empty object when no templated parts
    ✔ returns data from instance when templated
    ✔ returns empty if not existing in the template
    ✔ supports absolute templatePointers
    ✔ returns all values
    ✔ supports relative templatePointers

  relative json pointer util
    resolve to value
      ✔ resolves 0 from root
      ✔ resolves 0
      ✔ resolves 1
      ✔ resolves 1/0
      ✔ resolves 1/highly/nested/objects
      ✔ resolves from within array to sibling array in parent
      ✔ does not throw if 0 value and root reference
      ✔ throws if with leading zeros
      ✔ throws if non number
      ✔ throws when trying to go above the root
      ✔ throws if trying to get key of root
      ✔ resolves 0/objects
    resolve to property name
      ✔ resolves to index in array
      ✔ resolves to property name

  Link discovery based on examples in the JSON hyper schema spec
    ✔ Spec examples: Entry point links, no templates. Example in 9.1
    ✔ Spec examples: Individually Identified Resources Example in 9.2
    ✔ Spec examples: Updated entry point schema with thing Example in 9.2
    ✔ Spec examples: Submitting a payload and accepting URI input Example in 9.3


  41 passing (17ms)
  2 pending
```

## Utils

The following utils are currently in this repository, but will probably become their own package:

- relative-json-pointer: resolve relative json pointers according to https://tools.ietf.org/html/draft-handrews-relative-json-pointer-01

- extract-sub-schema: Extracts a new sub schema for one or more properties only
