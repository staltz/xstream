/// <reference types="mocha"/>
/// <reference types="node" />
import xs from '../../src/index';
import * as assert from 'assert';

describe('xs.throw()', function() {
  it('should create a stream with just one error emission', (done: any) => {
    const stream = xs.throw(new Error('not nice'));

    stream.addListener({
      next: () => done(new Error('This should not be called')),
      error: (err: any) => {
        assert.strictEqual(err instanceof Error, true);
        assert.strictEqual(err.message, 'not nice');
        done();
      },
      complete: done,
    });
  });
});
