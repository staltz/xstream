'use strict';
var generateDocs = require('./generate-docs');

generateDocs({
  src: './core.js',
  output: './markdown/generated-factories.md',
  template: './tools/template-factories.md.ejs'
});
