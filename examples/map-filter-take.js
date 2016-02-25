var xs = require('../lib/index').default;

var stream = xs.interval(1000)
  .take(10)
  .filter(i => i % 2 === 0)
  .map(i => i * i);

function observerNext(x) {
  console.log(x);
}

stream.subscribe({
  next: observerNext,
  error: err => console.error(err),
  complete: () => console.log('done'),
});
