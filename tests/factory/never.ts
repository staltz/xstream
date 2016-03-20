import xs from '../../src/index';

describe('xs.never()', () => {
  it('should create a stream with 0 events never ends', (done) => {
    const stream = xs.empty();

    const observer = {
      next: done,
      error: done,
      end: done,
    };

    stream.subscribe(observer);
    setTimeout(function() { stream.unsubscribe(observer); }, 1000);
  });
});
