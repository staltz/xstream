import xs from '../src/index';
import * as assert from 'assert';

describe('Stream', () => {
  it('can be subscribed and unsubscribed with one observer', (done) => {
    const stream = xs.interval(100);
    const expected = [0, 1, 2];
    let observer = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
        if (expected.length === 0) {
          stream.unsubscribe(observer);
          done();
        }
      },
      error: done.fail,
      end: done.fail,
    };
    stream.subscribe(observer);
  });
});
