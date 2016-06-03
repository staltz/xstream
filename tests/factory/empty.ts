/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs from '../../src/index';

describe('xs.empty()', function() {
  it('should create a stream with 0 events that has already completed', (done) => {
    const stream = xs.empty();

    stream.addListener({
      next: () => done(new Error('This should not be called')),
      error: () => done(new Error('This should not be called')),
      complete: done,
    });
  });
});
