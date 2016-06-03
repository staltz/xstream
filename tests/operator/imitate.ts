/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs, {Stream, MemoryStream} from '../../src/index';
import * as assert from 'assert';

describe('MimicStream.prototype.imitate', () => {
  it('should make the mimic stream act like the given stream', (done) => {
    const stream = xs.periodic(50).take(3);
    const proxyStream = xs.createMimic<number>();
    proxyStream.imitate(stream);

    const expected = [0, 1, 2];
    setTimeout(() => {
      proxyStream.addListener({
        next: (x: number) => {
          assert.equal(x, expected.shift());
        },
        error: (err: any) => done(err),
        complete: () => {
          assert.equal(expected.length, 0);
          done();
        },
      });
    }, 125);
  });

  it('should not by itself start a the imitated stream execution', (done) => {
    let nextDelivered = false;
    const stream = xs.periodic(50).take(3).debug(() => {
      nextDelivered = true;
    });
    const proxyStream = xs.createMimic<number>();

    setTimeout(() => {
      assert.equal(nextDelivered, false);
      done();
    }, 125);

    proxyStream.imitate(stream);
  });

  it('should throw an error when given a MemoryStream', (done) => {
    const stream = xs.periodic(50).take(3).remember();
    assert.strictEqual(stream instanceof MemoryStream, true);
    const proxyStream = xs.createMimic<number>();
    assert.throws(() => {
      proxyStream.imitate(stream);
    });
    done();
  });
});
