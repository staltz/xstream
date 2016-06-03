/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs, {Stream} from '../../src/index';
import dropRepeats from '../../src/extra/dropRepeats';
import * as assert from 'assert';

describe('dropRepeats (extra)', () => {
  it('should drop consecutive duplicate numbers (as events)', (done) => {
    const stream = xs.of(1, 2, 1, 1, 1, 2, 3, 4, 3, 3).compose(dropRepeats());
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
      .compose(dropRepeats((x: string, y: string) => x.toLowerCase() === y.toLowerCase()));
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
