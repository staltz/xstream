import {Operator, Stream} from '../index';

class DebounceOperator<T> implements Operator<T, T> {
  public type = 'debounce';
  public out: Stream<T> = null as any;
  private id: any = null;

  constructor(public dt: number,
              public ins: Stream<T>) {
    console.warn('All time based operators have been deprecated, please migrate to @cycle/time');
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
    this.clearInterval();
    this.id = setInterval(() => {
      this.clearInterval();
      u._n(t);
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
 * Delays events until a certain amount of silence has passed. If that timespan
 * of silence is not met the event is dropped.
 *
 * Marble diagram:
 *
 * ```text
 * --1----2--3--4----5|
 *     debounce(60)
 * -----1----------4--|
 * ```
 *
 * Example:
 *
 * ```js
 * import fromDiagram from 'xstream/extra/fromDiagram'
 * import debounce from 'xstream/extra/debounce'
 *
 * const stream = fromDiagram('--1----2--3--4----5|')
 *  .compose(debounce(60))
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
 * > 4
 * > completed
 * ```
 *
 * @param {number} period The amount of silence required in milliseconds.
 * @return {Stream}
 */
export default function debounce<T>(period: number): (ins: Stream<T>) => Stream<T> {
  return function debounceOperator(ins: Stream<T>) {
    return new Stream<T>(new DebounceOperator(period, ins));
  };
}
