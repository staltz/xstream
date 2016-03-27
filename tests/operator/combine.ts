import xs from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.combine', () => {
  it('should merge AND-style another stream with the primary stream', (done) => {
    const source = xs.interval(100).take(2);
    const other = xs.interval(120).take(2);
    const stream = source.combine((x, y) => `${x}${y}`, other);
    let expected = ['00', '10', '11'];
    stream.addListener({
      next: (x) => {
        assert.equal(x, expected.shift());
      },
      error: done.fail,
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });

  it('should complete only when all member streams have completed', (done) => {
    const source = xs.interval(30).take(1);
    const other = xs.interval(50).take(4);
    const stream = source.combine((x, y) => `${x}${y}`, other);
    let expected = ['00', '01', '02', '03'];
    stream.addListener({
      next: (x) => {
        assert.equal(x, expected.shift());
      },
      error: done.fail,
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });
});
