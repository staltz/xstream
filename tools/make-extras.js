'use strict';
var fs = require('fs');
var generateDocs = require('./generate-docs');

var allExtraJSFiles = fs.readdirSync('./extra/') // is an array
  .map(filename => './extra/' + filename)
  .filter(filename => filename.match(/\.js$/));

generateDocs({
  src: allExtraJSFiles,
  output: './markdown/generated-extras.md',
  template: './tools/template-extras.md.ejs'
});
