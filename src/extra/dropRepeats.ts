import {Operator, Stream} from '../index';
const empty = {};

export class DropRepeatsOperator<T> implements Operator<T, T> {
  public type = 'dropRepeats';
  public out: Stream<T> = null as any;
  public isEq: (x: T, y: T) => boolean;
  private v: T = <any> empty;

  constructor(public ins: Stream<T>,
              fn: ((x: T, y: T) => boolean) | undefined) {
    this.isEq = fn ? fn : (x, y) => x === y;
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = null as any;
    this.v = empty as any;
  }

  _n(t: T) {
    const u = this.out;
    if (!u) return;
    const v = this.v;
    if (v !== empty && this.isEq(t, v)) return;
    this.v = t;
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
    u._c();
  }
}

/**
 * Drops consecutive duplicate values in a stream.
 *
 * Marble diagram:
 *
 * ```text
 * --1--2--1--1--1--2--3--4--3--3|
 *     dropRepeats
 * --1--2--1--------2--3--4--3---|
 * ```
 *
 * Example:
 *
 * ```js
 * import dropRepeats from 'xstream/extra/dropRepeats'
 *
 * const stream = xs.of(1, 2, 1, 1, 1, 2, 3, 4, 3, 3)
 *   .compose(dropRepeats())
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
 * > 2
 * > 1
 * > 2
 * > 3
 * > 4
 * > 3
 * > completed
 * ```
 *
 * Example with a custom isEqual function:
 *
 * ```js
 * import dropRepeats from 'xstream/extra/dropRepeats'
 *
 * const stream = xs.of('a', 'b', 'a', 'A', 'B', 'b')
 *   .compose(dropRepeats((x, y) => x.toLowerCase() === y.toLowerCase()))
 *
 * stream.addListener({
 *   next: i => console.log(i),
 *   error: err => console.error(err),
 *   complete: () => console.log('completed')
 * })
 * ```
 *
 * ```text
 * > a
 * > b
 * > a
 * > B
 * > completed
 * ```
 *
 * @param {Function} isEqual An optional function of type
 * `(x: T, y: T) => boolean` that takes an event from the input stream and
 * checks if it is equal to previous event, by returning a boolean.
 * @return {Stream}
 */
export default function dropRepeats<T>(isEqual: ((x: T, y: T) => boolean) | undefined = void 0): (ins: Stream<T>) => Stream<T> {
  return function dropRepeatsOperator(ins: Stream<T>): Stream<T> {
    return new Stream<T>(new DropRepeatsOperator<T>(ins, isEqual));
  };
}
