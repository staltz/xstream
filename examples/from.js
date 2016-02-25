var xs = require('../lib/index').default;

var stream = xs.from([10, 20, 30, 40, 41, 42]);

stream.subscribe({
  next: x => console.log(x),
  error: err => console.error(err),
  complete: () => console.log('done'),
});
