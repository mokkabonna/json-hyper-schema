var path = require('path')

module.exports = {
  entry: './src/resolver.js',
  output: {
    path: path.resolve(__dirname, '../../pure-rest-api/public/js'),
    filename: 'json-hyper-schema.bundle.js'
  }
}
