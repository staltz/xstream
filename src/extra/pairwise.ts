import {Operator, Stream} from '../core';

class PairwiseOperator<T> implements Operator<T, [T, T]> {
  public type = 'pairwise';
  private val: T = null;
  private has: boolean = false;
  public out: Stream<[T, T]> = null;

  constructor(public ins: Stream<T>) {
  }

  _start(out: Stream<[T, T]>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.has = false;
    this.out = null;
    this.val = null;
  }

  _n(t: T) {
    const u = this.out;
    if (!u) return;
    if (this.has) {
      const prev = this.val;
      this.val = t;
      u._n([prev, t]);
    } else {
      this.val = t;
      this.has = true;
    }
  }

  _e(err: any) {
    const u = this.out;
    if (!u) return;
    u._e(err);
  }

  _c() {
    const u = this.out;
    if (!u) return;
    u._c();
  }
}

/**
 * Group consecutive pairs of events as arrays. Each array has two items.
 *
 * Marble diagram:
 *
 * ```text
 * ---1---2-----3-----4-----5--------|
 *       pairwise
 * -------[1,2]-[2,3]-[3,4]-[4,5]----|
 * ```
 *
 * Example:
 *
 * ```js
 * import pairwise from 'xstream/extra/pairwise'
 *
 * const stream = xs.of(1, 2, 3, 4, 5, 6).compose(pairwise)
 *
 * stream.addListener({
 *   next: i => console.log(i),
 *   error: err => console.error(err),
 *   complete: () => console.log('completed')
 * })
 * ```
 *
 * ```text
 * > [1,2]
 * > [2,3]
 * > [3,4]
 * > [4,5]
 * > [5,6]
 * > completed
 * ```
 *
 * @return {Stream}
 */
export default function pairwise<T>(ins: Stream<T>): Stream<[T, T]> {
  return new Stream<[T, T]>(new PairwiseOperator(ins));
}
