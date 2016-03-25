import xs from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.flatten', () => {
  describe('with map', () => {
    it('should expand each interval event with 3 sync events', (done) => {
      const stream = xs.interval(100).take(3)
      .map(i => xs.from([1 + i, 2 + i, 3 + i]))
      .flatten();
      const expected = [1, 2, 3, 2, 3, 4, 3, 4, 5];
      const observer = {
        next: (x: number) => {
          assert.equal(x, expected.shift());
          if (expected.length === 0) {
            stream.removeListener(observer);
            done();
          }
        },
        error: done.fail,
        end: done.fail,
      };
      stream.addListener(observer);
    });

    it('should expand 3 sync events as an interval each', (done) => {
      const stream = xs.from([0, 1, 2])
        .map(i => xs.interval(100 * i).take(2).map(x => `${i}${x}`))
        .flatten();
      // ---|---|---|---|---|---|
      // ---00--01
      // -------10------11
      // -----------20----------21
      const expected = ['00', '01', '10', '20', '11', '21'];
      const observer = {
        next: (x: number) => {
          assert.equal(x, expected.shift());
          if (expected.length === 0) {
            stream.removeListener(observer);
            done();
          }
        },
        error: (err: any) => done(err),
        end: () => done(new Error('No end() should be called')),
      };
      stream.addListener(observer);
    });
  });
});
