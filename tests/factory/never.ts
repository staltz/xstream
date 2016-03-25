import xs from '../../src/index';

describe('xs.never()', () => {
  it('should create a stream with 0 events never ends', (done) => {
    const stream = xs.never();

    const observer = {
      next: () => done(new Error('This should not be called')),
      error: () => done(new Error('This should not be called')),
      end: () => done(new Error('This should not be called')),
    };

    stream.addListener(observer);
    setTimeout(function() { stream.removeListener(observer); done(); }, 1000);
  });
});
