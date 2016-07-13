'use strict';
var markdox = require('markdox');

module.exports = function generateDocs(options) {
  markdox.process(
    options.src,
    {output: options.output, template: options.template},
    function generationCallback(err/*, output */) {
      if (err) {
        console.error(err);
      } else {
        console.log('File `' + options.output + '` generated with success');
      }
    }
  );
}
