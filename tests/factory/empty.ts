import xs from '../../src/index';

describe('xs.empty()', function() {
  it('should create a stream with 0 events that has already ended', (done) => {
    const stream = xs.empty();

    stream.subscribe({
      next: done,
      error: done,
      end: done,
    });
  });
});
