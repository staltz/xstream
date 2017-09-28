/// <reference types="mocha"/>
/// <reference types="node" />
import xs from '../../src/index';
import delay from '../../src/extra/delay';
import periodic from '../../src/extra/periodic';
import * as assert from 'assert';

console.warn = () => {};

describe('delay (extra)', () => {
  it('should delay periodic events by a given time period', (done: any) => {
    const stream = periodic(100).take(3).compose(delay(200));
    const expected = [0, 1, 2];
    let completeCalled = false;

    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err: Error) => done(err),
      complete: () => { completeCalled = true; },
    });

    setTimeout(() => assert.equal(expected.length, 3), 250);
    setTimeout(() => assert.equal(expected.length, 2), 350);
    setTimeout(() => assert.equal(expected.length, 1), 450);
    setTimeout(() => {
      assert.equal(expected.length, 0)
      assert.equal(completeCalled, true);
      done();
    }, 550);
  });

  it('should delay synchronous events by a given time period', (done: any) => {
    const stream = xs.of(10, 20, 30).compose(delay(100));
    const expected = [10, 20, 30];
    let completeCalled = false;

    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err: Error) => done(err),
      complete: () => { completeCalled = true; },
    });

    setTimeout(() => assert.equal(expected.length, 3), 50);
    setTimeout(() => {
      assert.equal(expected.length, 0)
      assert.equal(completeCalled, true);
      done();
    }, 150);
  });
});
