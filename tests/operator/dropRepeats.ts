import xs from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.dropRepeats', () => {
  it('should drop consecutive duplicate numbers (as events)', (done) => {
    const stream = xs.of(1, 2, 1, 1, 1, 2, 3, 4, 3, 3).dropRepeats();
    const expected = [1, 2, 1, 2, 3, 4, 3];

    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });

  it('should drop consecutive \'duplicate\' strings, with a custom isEqual', (done) => {
    const stream = xs.of('a', 'b', 'a', 'A', 'B', 'b')
      .dropRepeats((x, y) => x.toLowerCase() === y.toLowerCase());
    const expected = ['a', 'b', 'a', 'B'];

    stream.addListener({
      next: (x: string) => {
        assert.equal(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });
});
