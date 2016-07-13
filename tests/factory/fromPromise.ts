/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import {Promise} from 'es6-promise';
import xs from '../../src/index';
import * as assert from 'assert';

describe('xs.fromPromise', () => {
  it('should convert a resolved promise to a stream', (done) => {
    const stream = xs.fromPromise(Promise.resolve('yes'));
    let nextSent = false;

    stream.addListener({
      next: (x: string) => {
        assert.strictEqual(x, 'yes');
        nextSent = true;
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.strictEqual(nextSent, true);
        done();
      },
    });
  });

  it('should convert a rejected promise to a stream', (done) => {
    const stream = xs.fromPromise(Promise.reject('no'));

    stream.addListener({
      next: (x: string) => done('next should not be called'),
      error: (err: any) => {
        assert.strictEqual(err, 'no');
        done();
      },
      complete: () => done('complete should not be called'),
    });
  });
});
