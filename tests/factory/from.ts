import xs from '../../src/index';
import * as assert from 'assert';

describe('xs.from', () => {
  it('should convert an array to a stream', (done) => {
    const stream = xs.from([10, 20, 30, 40, 50])
      .map(i => String(i));
    let expected = ['10', '20', '30', '40', '50'];
    let listener = {
      next: (x: string) => {
        assert.equal(x, expected.shift());
      },
      error: done.fail,
      end: () => {
        assert.equal(expected.length, 0);
        done();
      },
    };
    stream.addListener(listener);
  });
});
