'use strict';
var generateDocs = require('./generate-docs');

generateDocs({
  src: './core.js',
  output: './markdown/generated-methods.md',
  template: './tools/template-methods.md.ejs'
});
