import xs from '../../src/index';
import * as assert from 'assert';

/*
describe('Stream.prototype.filter', () => {
  it('should filter in only even numbers from an input stream', (done) => {
    const stream = xs.periodic(50).filter(i => i % 2 === 0);
    const expected = [0, 2, 4, 6];
    let listener = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
        if (expected.length === 0) {
          stream.removeListener(listener);
          done();
        }
      },
      error: done.fail,
      complete: done.fail,
    };
    stream.addListener(listener);
  });

  it('should propagate user mistakes in predicate as errors', (done) => {
    const source = xs.periodic(30).take(1);
    const stream = source.filter(
      x => (<string> <any> x).toLowerCase() === 'a'
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

  it('should clean up Operator producer when complete', (done) => {
    const stream = xs.of(1, 2, 3).filter(i => i !== 2);
    const expected = [1, 3];
    let completeCalled = false;

    stream.addListener({
      next: (x: number) => {
        assert.strictEqual(x, expected.shift());
        assert.strictEqual(stream['_prod']['out'], stream);
      },
      error: (err: any) => done(err),
      complete: () => {
        completeCalled = true;
      },
    });

    assert.strictEqual(completeCalled, true);
    assert.strictEqual(stream['_prod']['out'], null);
    done();
  });
});
*/
