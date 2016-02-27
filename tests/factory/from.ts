import xs from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.from', () => {
  it('should convert an array to a stream', (done) => {
    const stream = xs.from([10, 20, 30, 40, 50])
      .map(i => String(i));
    let expected = ['10', '20', '30', '40', '50'];
    let observer = {
      next: (x: string) => {
        assert.equal(x, expected.shift());
      },
      error: done.fail,
      end: () => {
        assert.equal(expected.length, 0);
        done();
      },
    };
    stream.subscribe(observer);
  });
});
