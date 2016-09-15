/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import {Promise} from 'es6-promise';
import xs, { Observable } from '../../src/index';
import * as assert from 'assert';
import * as most from 'most';

describe('xs.from', () => {
  it('should convert a resolved promise to a stream', (done) => {
    const stream = xs.from(Promise.resolve('yes'));
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
    const stream = xs.from(Promise.reject('no'));

    stream.addListener({
      next: (x: string) => done('next should not be called'),
      error: (err: any) => {
        assert.strictEqual(err, 'no');
        done();
      },
      complete: () => done('complete should not be called'),
    });
  });

  it('should convert an array to a stream', (done) => {
    const stream = xs.from([10, 20, 30, 40, 50])
      .map(i => String(i));
    let expected = ['10', '20', '30', '40', '50'];

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

  it('should convert an observable to a stream', (done) => {
    const observable = most.from<number>([10, 20, 30, 40, 50]);
    const stream = xs.from(observable as Observable<number>)
      .map(i => String(i));
    let expected = ['10', '20', '30', '40', '50'];

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
