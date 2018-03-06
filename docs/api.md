# API of the library


## prepare links

### lib.resolve(schema, data)

This function returns an array of link resolution objects. It contains partially or fully resolved links. The presence of targetUri indicates that it is fully resolved.

Given the schema link:

```js
{
  rel: 'category',
  href: '/categories/{category}'
}
```

and the instance data:

```
{
  id: 1,
  category: 'clothes'
}
```

The output is as follows:

```js
{
  contextUri: 'https://example.io/products/1',
  contextPointer: '',
  rel: 'category',
  targetUri: 'https://example.io/categories/clothes',
  attachmentPointer: ''
}
```
