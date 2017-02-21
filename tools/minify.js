var compiler = require('google-closure-compiler-js').compile;
var fs = require('fs');
var source = fs.readFileSync('dist/xstream.js', 'utf8');

var compilerFlags = {
  jsCode: [{src: source}],
  languageIn: 'ES5',
  createSourceMap: true,
  // compilationLevel: 'ADVANCED',
};

var output = compiler(compilerFlags);
fs.writeFileSync('dist/xstream.min.js', output.compiledCode, 'utf8');
fs.writeFileSync('dist/xstream.min.js.map', output.sourceMap, 'utf8');