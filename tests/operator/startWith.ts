/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs, {MemoryStream} from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.startWith', () => {
  it('should allow starting with a value', (done) => {
    const stream = xs.of(100);

    stream.startWith(1).take(1).addListener({
      next(x: any) {
        assert.strictEqual(x, 1);
      },
      error: done,
      complete: done
    });
  });

  it('should return a MemoryStream', (done) => {
    const stream = xs.of(100).startWith(1);
    assert.strictEqual(stream instanceof MemoryStream, true);
    done();
  });
});
