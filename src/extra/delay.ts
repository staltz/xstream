import {Operator, Stream} from '../core';

class DelayOperator<T> implements Operator<T, T> {
  public type = 'delay';
  public out: Stream<T> = null;

  constructor(public dt: number,
              public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = null;
  }

  _n(t: T) {
    const u = this.out;
    if (!u) return;
    const id = setInterval(() => {
      u._n(t);
      clearInterval(id);
    }, this.dt);
  }

  _e(err: any) {
    const u = this.out;
    if (!u) return;
    const id = setInterval(() => {
      u._e(err);
      clearInterval(id);
    }, this.dt);
  }

  _c() {
    const u = this.out;
    if (!u) return;
    const id = setInterval(() => {
      u._c();
      clearInterval(id);
    }, this.dt);
  }
}

/**
 * Delays periodic events by a given time period.
 *
 * Marble diagram:
 *
 * ```text
 * 1----2--3--4----5|
 *     delay(60)
 * ---1----2--3--4----5|
 * ```
 *
 * Example:
 *
 * ```js
 * import fromDiagram from 'xstream/extra/fromDiagram'
 * import delay from 'xstream/extra/delay'
 *
 * const stream = fromDiagram('1----2--3--4----5|')
 *  .compose(delay(60))
 *
 * stream.addListener({
 *   next: i => console.log(i),
 *   error: err => console.error(err),
 *   complete: () => console.log('completed')
 * })
 * ```
 *
 * ```text
 * > 1  (after 60 ms)
 * > 2  (after 160 ms)
 * > 3  (after 220 ms)
 * > 4  (after 280 ms)
 * > 5  (after 380 ms)
 * > completed
 * ```
 *
 * @param {number} period The amount of silence required in milliseconds.
 * @return {Stream}
 */
export default function delay<T>(period: number): (ins: Stream<T>) => Stream<T> {
  return function delayOperator(ins: Stream<T>): Stream<T> {
    return new Stream<T>(new DelayOperator(period, ins));
  };
}
