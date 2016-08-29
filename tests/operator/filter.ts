/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs, {Stream, MemoryStream} from '../../src/index';
import * as assert from 'assert';

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
      error: done,
      complete: () => done('complete should not be called'),
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
    assert.strictEqual(JSON.stringify(stream['_prod']['out']), '{}');
    done();
  });

  it('should allow multiple filters to be fused', (done) => {
    const isEven = (x: number) => x % 2 === 0;
    const isGreaterThan5 = (x: number) => x > 5;

    const stream = xs.of(1, 2, 3, 4, 5, 6, 7, 8)
      .filter(isEven)
      .filter(isGreaterThan5);

    const expected = [6, 8];

    stream.addListener({
      next(x: number) {
        assert.strictEqual(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete() {
        assert.strictEqual(expected.length, 0);
        done();
      }
    });
  });

  it('should should have filter+map fusion metadata', (done) => {
    const isEven = (x: number) => x % 2 === 0;
    const stream = xs.of(1, 2, 3, 4, 5, 6, 7, 8)
      .filter(isEven)
      .map(x => 10 * x);

    assert.strictEqual(stream['_prod']['type'], 'filter+map');
    done();
  });

  it('should should have filter+mapTo fusion metadata', (done) => {
    const isEven = (x: number) => x % 2 === 0;
    const stream = xs.of(1, 2, 3, 4, 5, 6, 7, 8)
      .filter(isEven)
      .mapTo(10);

    assert.strictEqual(stream['_prod']['type'], 'filter+mapTo');
    done();
  });

  it('should call functions in correct order for filter+filter fusion', (done) => {
    const object$ = xs.of<any>(
      { foo: { a: 10 } },
      { foo: { bar: { b: 20 } } },
      { foo: true }
    );

    const filtered$ = object$
      .filter(val => val.foo)
      .filter(val => val.foo.bar)
      .filter(val => val.foo.bar.b === 20)
      .map(x => JSON.stringify(x));

    const expected = ['{"foo":{"bar":{"b":20}}}'];

    filtered$.addListener({
      next(x: string) {
        assert.strictEqual(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete() {
        assert.strictEqual(expected.length, 0);
        done();
      }
    });
  });

  it('should return a Stream if input stream is a Stream', (done) => {
    const input = xs.of<number>(1, 2, 3);
    assert.strictEqual(input instanceof Stream, true);
    const stream: Stream<number> = input.filter(x => x % 2 === 0);
    assert.strictEqual(stream instanceof Stream, true);
    done();
  });

  it('should return a Stream if input stream is a MemoryStream', (done) => {
    const input = xs.of<number>(1, 2, 3).remember();
    assert.strictEqual(input instanceof MemoryStream, true);
    const stream: Stream<number> = input.filter(x => x % 2 === 0);
    assert.strictEqual(stream instanceof Stream, true);
    done();
  });

  it('should return stream of constrained type if predicate is type guard', (done) => {
    class Animal { }
    class Dog extends Animal {
      thisIsADog: boolean;
    }
    class Cat extends Animal {
      thisIsACat: boolean;
    }

    function isDog(a: Animal): a is Dog {
      return a instanceof Dog;
    }

    const input: Stream<Animal> = xs.of<Animal>(
      new Animal(), new Cat(), new Dog(), new Animal()
    );
    const output: Stream<Dog> = input.filter(isDog);
    done();
  });
});
