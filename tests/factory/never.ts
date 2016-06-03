/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs from '../../src/index';

describe('xs.never()', () => {
  it('should create a stream with 0 events never ends', (done) => {
    const stream = xs.never();

    const listener = {
      next: () => done(new Error('This should not be called')),
      error: () => done(new Error('This should not be called')),
      complete: () => done(new Error('This should not be called')),
    };

    stream.addListener(listener);
    setTimeout(function() { stream.removeListener(listener); done(); }, 1000);
  });
});
