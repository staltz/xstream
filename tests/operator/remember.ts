import xs from '../../src/index';
import {emptyListener} from '../../src/utils/emptyListener';
import * as assert from 'assert';

describe('Stream.prototype.remember', () => {
  it('should replay the second event to a new observer', (done) => {
    const stream = xs.interval(50).take(4).remember();

    stream.addListener(emptyListener);

    let expected = [1, 2, 3];
    setTimeout(() => {
      stream.addListener({
        next(x) {
          assert.strictEqual(x, expected.shift());
        },
        error: done.fail,
        end: () => {
          assert.strictEqual(expected.length, 0);
          done();
        }
      });
    }, 125);
  });

  it('should allow use like a subject', (done) => {
    const stream = xs.MemoryStream()

    stream.next(1);

    stream.addListener({
      next(x: any) {
        assert.strictEqual(x, 1);
      },
      error: done.fail,
      end: done,
    });

    stream.end();
  });
});
