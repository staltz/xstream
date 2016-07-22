/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs, {Stream, MemoryStream} from '../../src/index';
import * as assert from 'assert';
import * as sinon from 'sinon';

var sandbox: sinon.SinonSandbox;
describe('Stream.prototype.debug', () => {
  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('should allow inspecting the operator chain', (done) => {
    const expected = [0, 1, 2];
    const stream = xs.periodic(50).take(3).debug(x => {
      assert.equal(x, expected.shift());
    });
    let listener = {
      next: (x: number) => {
        if (x === 2) {
          assert.equal(expected.length, 0);
          stream.removeListener(listener);
          done();
        }
      },
      error: done,
      complete: () => done('complete should not be called'),
    };
    stream.addListener(listener);
  });

  it('should use console.log if no argument given', (done) => {
    let stub = sandbox.stub(console, 'log');

    const expected = [0, 1, 2];
    const stream = xs.periodic(50).take(3).debug();

    assert.doesNotThrow(() => {
      stream.addListener({
        next: (x: number) => {
          assert.equal(x, expected.shift());
        },
        error: (err) => done(err),
        complete: () => {
          assert.strictEqual(stub.callCount, 3);
          assert.strictEqual(stub.firstCall.args[0], 0);
          assert.strictEqual(stub.secondCall.args[0], 1);
          assert.strictEqual(stub.thirdCall.args[0], 2);
          done();
        },
      });
    });
  });

  it('should return a Stream if input stream is a Stream', (done) => {
    const input = xs.of<number>(1, 2, 3);
    assert.strictEqual(input instanceof Stream, true);
    const stream: Stream<number> = input.debug('stream');
    assert.strictEqual(stream instanceof Stream, true);
    done();
  });

  it('should return a MemoryStream if input stream is a MemoryStream', (done) => {
    const input = xs.of<number>(1, 2, 3).remember();
    assert.strictEqual(input instanceof MemoryStream, true);
    const stream: MemoryStream<number> = input.debug('stream');
    assert.strictEqual(stream instanceof MemoryStream, true);
    done();
  });

  it('should propagate user mistakes in spy as errors', (done) => {
    const source = xs.periodic(30).take(1);
    const stream = source.debug(
      x => <number> <any> (<string> <any> x).toLowerCase()
    );
    stream.addListener({
      next: () => done('next should not be called'),
      error: (err) => {
        assert.notStrictEqual(err.message.match(/is not a function$/), null);
        done();
      },
      complete: () => {
        done('complete should not be called');
      },
    });
  });
});
