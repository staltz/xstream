import {Operator, Stream} from '../core';

class ThrottleOperator<T> implements Operator<T, T> {
  public type = 'throttle';
  public out: Stream<T> = null as any;
  private id: any = null;

  constructor(public dt: number,
              public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = null as any;
    this.id = null;
  }

  clearInterval() {
    const id = this.id;
    if (id !== null) {
      clearInterval(id);
    }
    this.id = null;
  }

  _n(t: T) {
    const u = this.out;
    if (!u) return;
    if (this.id) return;
    u._n(t);
    this.id = setInterval(() => {
      this.clearInterval();
    }, this.dt);
  }

  _e(err: any) {
    const u = this.out;
    if (!u) return;
    this.clearInterval();
    u._e(err);
  }

  _c() {
    const u = this.out;
    if (!u) return;
    this.clearInterval();
    u._c();
  }
}

/**
 * Emits event and drops subsequent events until a certain amount of silence has passed.
 *
 * Marble diagram:
 *
 * ```text
 * --1-2-----3--4----5|
 *     throttle(60)
 * --1-------3-------5-|
 * ```
 *
 * Example:
 *
 * ```js
 * import fromDiagram from 'xstream/extra/fromDiagram'
 * import throttle from 'xstream/extra/throttle'
 *
 * const stream = fromDiagram('--1-2-----3--4----5|')
 *  .compose(throttle(60))
 *
 * stream.addListener({
 *   next: i => console.log(i),
 *   error: err => console.error(err),
 *   complete: () => console.log('completed')
 * })
 * ```
 *
 * ```text
 * > 1
 * > 3
 * > 5
 * > completed
 * ```
 *
 * @param {number} period The amount of silence required in milliseconds.
 * @return {Stream}
 */
export default function throttle(period: number): <T>(ins: Stream<T>) => Stream<T> {
  return function throttleOperator<T>(ins: Stream<T>) {
    return new Stream<T>(new ThrottleOperator(period, ins));
  };
}
