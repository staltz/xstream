/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs, {Stream, MemoryStream} from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.mapTo', () => {
  it('should transform events to a constant value', (done) => {
    const stream = xs.periodic(100).mapTo(10);
    const expected = [10, 10, 10];
    let listener = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
        if (expected.length === 0) {
          stream.removeListener(listener);
          done();
        }
      },
      error: done,
      complete: () => done('complete should not be called'),
    };
    stream.addListener(listener);
  });
  
  it('should return a Stream if input stream is a Stream', (done) => {
    const input = xs.of(1, 2, 3);
    assert.strictEqual(input instanceof Stream, true);
    const stream: Stream<number> = input.mapTo(10);
    assert.strictEqual(stream instanceof Stream, true);
    done();
  });

  it('should return a MemoryStream if input stream is a MemoryStream', (done) => {
    const input = xs.of(1, 2, 3).remember();
    assert.strictEqual(input instanceof MemoryStream, true);
    const stream: MemoryStream<number> = input.mapTo(10);
    assert.strictEqual(stream instanceof MemoryStream, true);
    done();
  });

  it('should have \'type\' metadata on the operator producer', (done) => {
    const stream = xs.periodic(100).mapTo(10);
    assert.strictEqual(stream['_prod']['type'], 'mapTo');
    done();
  });
});
