/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs, {Stream} from '../../src/index';
import fromDiagram from '../../src/extra/fromDiagram';
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

  it('should drop consecutive duplicate numbers, with a circular stream dependency', (done) => {
    const streamProxy = xs.create();
    const input = xs.of(0, 0, 1, 1, 1)
    const stream = xs.merge(streamProxy, input).compose(dropRepeats());
    streamProxy.imitate(stream);
    const expected = [0, 1];

    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {},
    });

    input.addListener({
      next: (x: number) => {},
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });

  it('should support dropping duplicates of combine arrays', (done) => {
    const A: Stream<string> = fromDiagram('---a---b------b------|');
    const B: Stream<string> = fromDiagram('-x---y---y------z--y-|');
    const stream = xs.combine(A, B).compose(
      dropRepeats(([i1, i2]: [string, string], [j1, j2]: [string, string]) => {
        return i1 === j1 && i2 === j2;
      })
    ).map(arr => arr.join(''));

    const expected = ['ax', 'ay', 'by', 'bz', 'by'];
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
