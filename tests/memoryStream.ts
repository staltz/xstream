import xs from '../src/index';
import * as assert from 'assert';

describe('MemoryStream', () => {
  it('should allow use like a subject', (done) => {
    const stream = xs.createWithMemory();

    stream.shamefullySendNext(1);

    stream.addListener({
      next(x: any) {
        assert.strictEqual(x, 1);
      },
      error: done.fail,
      complete: done,
    });

    stream.shamefullySendComplete();
  });
});
