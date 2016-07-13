'use strict';
var generateDocs = require('./generate-docs');

generateDocs({
  src: './core.js',
  output: './markdown/generated-toc.md',
  template: './tools/template-toc.md.ejs'
});
