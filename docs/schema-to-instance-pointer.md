A util that determines what schema pointers apply to which instance values

/ => /
/properties/foo => /foo
/properties/properties/properties/foo => /properties/foo
/properties/array/items/2 = /array/2
/allOf/0/properties/foo => /foo
/anyOf/0/properties/foo => /foo
/properties/properties/properties/foo/items/0 => /properties/foo/0

/patternProperties/foo => /foo
/patternProperties/foo.+ => /foo1, /foofoo etc
/additionalProperties => /* //need to know about properties and patternProperties



/items/0 => /0
/items => /0-X // how to solve this?

/items/0 => /0
/items/1 => /1
/additionalItems => /2-X  //need to know about items keyword also

