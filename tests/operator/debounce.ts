import xs, {Listener, Producer} from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.debounce', () => {
  it('should delay events until a period of silence has passed', (done) => {
    const producer: Producer<number> = {
      start(out: Listener<number>) {
        out.next(1);
        out.next(2);
        out.next(5);
      },
      stop() {}
    }
    const stream = xs.create(producer).debounce(100);
    const expected = [5];
    let listener = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
        if (expected.length === 0) {
          stream.removeListener(listener);
          done();
        }
      },
      error: done.fail,
      complete: done.fail,
    };
    stream.addListener(listener);
  });
});
