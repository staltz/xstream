import xs, {Listener, Producer} from '../../src/index';
import debounce from '../../src/extra/debounce';
import fromDiagram from '../../src/extra/fromDiagram';
import * as assert from 'assert';

describe('debounce (extra)', () => {
  it('should delay events until a period of silence has passed', (done: any) => {
    const producer: Producer<number> = {
      start(out: Listener<number>) {
        out.next(1);
        out.next(2);
        out.next(5);
      },
      stop() {}
    };
    const stream = xs.create(producer).compose(debounce(100));
    const expected = [5];
    let listener = {
      next: (x: number) => {
        assert.equal(x, expected.shift());
        if (expected.length === 0) {
          stream.removeListener(listener);
          done();
        }
      },
      error: (err: Error) => done(err),
      complete: () => done(new Error('This should not be called')),
    };
    stream.addListener(listener);
  });

  it('should emit any pending value upon completion', (done: any) => {
    const stream = fromDiagram('-1----2-|').compose(debounce(50));
    const expected = [1, 2];
    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err: Error) => done(err),
      complete: () => {
        assert.strictEqual(expected.length, 0);
        done();
      },
    });
  });

  it('should not emit value upon completion if no pending value', (done: any) => {
    const stream = fromDiagram('-1----2-------|').compose(debounce(50));
    const expected = [1, 2];
    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err: Error) => done(err),
      complete: () => {
        assert.strictEqual(expected.length, 0);
        done();
      },
    });
  });
});
