/// <reference types="mocha"/>
/// <reference types="node" />
import xs, {Stream, MemoryStream} from '../../src/index';
import periodic from '../../src/extra/periodic';
import * as assert from 'assert';

console.warn = () => {};

describe('Stream.prototype.map', () => {
  it('should transform values from input stream to output stream', (done: any) => {
    const stream = periodic(100).map(i => 10 * i).take(3);
    const expected = [0, 10, 20];

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

  it('should propagate user mistakes in project as errors', (done: any) => {
    const source = periodic(30).take(1);
    const stream = source.map(
      x => (<string> <any> x).toLowerCase()
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

  it('should clean up Operator producer when complete', (done: any) => {
    const stream = xs.of(1, 2, 3).map(i => i * 10);
    const expected = [10, 20, 30];
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
    assert.strictEqual(JSON.stringify(stream['_prod']['out']), '{}');
    done();
  });

  it('should return a Stream if input stream is a Stream', (done: any) => {
    const input = xs.of(1, 2, 3);
    assert.strictEqual(input instanceof Stream, true);
    const stream: Stream<number> = input.map(x => x * 10);
    assert.strictEqual(stream instanceof Stream, true);
    done();
  });

  it('should return a MemoryStream if input stream is a MemoryStream', (done: any) => {
    const input = xs.of(1, 2, 3).remember();
    assert.strictEqual(input instanceof MemoryStream, true);
    const stream = input.map(x => x * 10);
    assert.strictEqual(stream instanceof MemoryStream, true);
    done();
  });

  it('should clean up Operator producer when failed', (done: any) => {
    const stream = xs.of<any>('a', 'b', 3).map(i => i.toUpperCase());
    const expected = ['A', 'B'];
    let errorCalled = false;

    stream.addListener({
      next: (x: number) => {
        assert.strictEqual(x, expected.shift());
        assert.strictEqual(stream['_prod']['out'], stream);
      },
      error: (err: any) => {
        errorCalled = true;
      },
      complete: () => {
        done('complete should not be called');
      },
    });

    assert.strictEqual(errorCalled, true);
    assert.strictEqual(expected.length, 0);
    assert.strictEqual(JSON.stringify(stream['_prod']['out']), '{}');
    done();
  });

  it('should not repeat the map project function (e.g. no map+map fusion)', (done: any) => {
    const stream = xs.create();
    let firstMapCalled = 0;

    const source$ = stream.map(x => {
      firstMapCalled += 1;
      return {a: 10, b: 20, c: 30};
    });

    const a$ = source$.map(x => x.a);
    const b$ = source$.map(x => x.b);
    const c$ = source$.map(x => x.c);

    const expectedA = [10];
    const expectedB = [20];
    const expectedC = [30];

    a$.addListener({next: a => assert.strictEqual(a, expectedA.shift())});
    b$.addListener({next: b => assert.strictEqual(b, expectedB.shift())});
    c$.addListener({next: c => assert.strictEqual(c, expectedC.shift())});

    stream.shamefullySendNext(1);

    setTimeout(() => {
      assert.strictEqual(firstMapCalled, 1);
      assert.strictEqual(expectedA.length, 0);
      assert.strictEqual(expectedB.length, 0);
      assert.strictEqual(expectedC.length, 0);
      done();
    });
  });

  it('should not repeat the map project function (e.g. no filter+map+map fusion)', (done: any) => {
    const stream = xs.create();
    let firstMapCalled = 0;

    const source$ = stream.filter(x => x !== 42).map(x => {
      firstMapCalled += 1;
      return {a: 10, b: 20, c: 30};
    });

    const a$ = source$.map(x => x.a);
    const b$ = source$.map(x => x.b);
    const c$ = source$.map(x => x.c);

    const expectedA = [10];
    const expectedB = [20];
    const expectedC = [30];

    a$.addListener({next: a => assert.strictEqual(a, expectedA.shift())});
    b$.addListener({next: b => assert.strictEqual(b, expectedB.shift())});
    c$.addListener({next: c => assert.strictEqual(c, expectedC.shift())});

    stream.shamefullySendNext(1);

    setTimeout(() => {
      assert.strictEqual(firstMapCalled, 1);
      assert.strictEqual(expectedA.length, 0);
      assert.strictEqual(expectedB.length, 0);
      assert.strictEqual(expectedC.length, 0);
      done();
    });
  });
});
