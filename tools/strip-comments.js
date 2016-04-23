var stripComments = require('strip-comments')

process.stdin.setEncoding('utf8');

var data = '';

process.stdin.on('readable', () => {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    data = data + chunk;
  }
});

process.stdin.on('end', () => {
  process.stdout.write(stripComments(data));
});
