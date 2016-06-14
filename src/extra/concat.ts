import {Stream, InternalProducer, InternalListener, OutSender} from '../core';

class ConcatProducer<T> implements InternalProducer<T>, InternalListener<T>, OutSender<T> {
  public type = 'concat';
  public out: Stream<T> = null;
  private i: number = 0;

  constructor(public streams: Array<Stream<T>>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.streams[this.i]._add(this);
  }

  _stop(): void {
    const streams = this.streams;
    if (this.i < streams.length) {
      streams[this.i]._remove(this);
    }
    this.i = 0;
    this.out = null;
  }

  _n(t: T) {
    const u = this.out;
    if (!u) return;
    u._n(t);
  }

  _e(err: any) {
    const u = this.out;
    if (!u) return;
    u._e(err);
  }

  _c() {
    const u = this.out;
    if (!u) return;
    const streams = this.streams;
    streams[this.i]._remove(this);
    if (++this.i < streams.length) {
      streams[this.i]._add(this);
    } else {
      u._c();
    }
  }
}

/**
 * Puts one stream after the other. *concat* is a factory that takes multiple
 * streams as arguments, and starts the `n+1`-th stream only when the `n`-th
 * stream has completed. It concatenates those streams together.
 *
 * Marble diagram:
 *
 * ```text
 * --1--2---3---4-|
 * ...............--a-b-c--d-|
 *           concat
 * --1--2---3---4---a-b-c--d-|
 * ```
 *
 * Example:
 *
 * ```js
 * import concat from 'xstream/extra/concat'
 *
 * const streamA = xs.of('a', 'b', 'c')
 * const streamB = xs.of(10, 20, 30)
 * const streamC = xs.of('X', 'Y', 'Z')
 *
 * const outputStream = concat(streamA, streamB, streamC)
 *
 * outputStream.addListener({
 *   next: (x) => console.log(x),
 *   error: (err) => console.error(err),
 *   complete: () => console.log('concat completed'),
 * })
 * ```
 *
 * @factory true
 * @param {Stream} stream1 A stream to concatenate together with other streams.
 * @param {Stream} stream2 A stream to concatenate together with other streams. Two
 * or more streams may be given as arguments.
 * @return {Stream}
 */
export default function concat<T>(...streams: Array<Stream<T>>): Stream<T> {
  return new Stream<T>(new ConcatProducer(streams));
}
