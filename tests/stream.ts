import xs from '../src/index';
import * as assert from 'assert';

describe('Stream', () => {
  it('can be subscribed and unsubscribed with one observer', (done) => {
    const stream = xs.interval(100);
    let i = 0;
    let observer = {
      next: (x: number) => {
        assert.equal(x, i);
        i += 1;
        if (i === 2) {
          stream.unsubscribe(observer);
          done();
        }
      },
      error: done.fail,
      complete: done.fail,
    };
    stream.subscribe(observer);
  });
});
