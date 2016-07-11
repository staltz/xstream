import {Operator, InternalListener, Stream, OutSender, NO_IL} from '../core';

class OtherIL<T> implements InternalListener<any>, OutSender<T> {
  constructor(public out: Stream<T>,
              private op: DropUntilOperator<T>) {
  }

  _n(t: T) {
    this.op.up();
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.op.up();
  }
}

export class DropUntilOperator<T> implements Operator<T, T> {
  public type = 'dropUntil';
  public out: Stream<T> = null;
  private oil: InternalListener<any> = NO_IL; // oil = other InternalListener
  private on: boolean = false;

  constructor(public o: Stream<any>, // o = other
              public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.o._add(this.oil = new OtherIL(out, this));
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.o._remove(this.oil);
    this.out = null;
    this.oil = null;
  }

  up(): void {
    this.on = true;
    this.o._remove(this.oil);
    this.oil = null;
  }

  _n(t: T) {
    const u = this.out;
    if (!u) return;
    if (!this.on) return;
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
    this.up();
    u._c();
  }
}

/**
 * Starts emitting the input stream when another stream emits a next event. The
 * output stream will complete if/when the other stream completes.
 *
 * Marble diagram:
 *
 * ```text
 * ---1---2-----3--4----5----6---
 *   dropUntil( --------a--b--| )
 * ---------------------5----6|
 * ```
 *
 * Example:
 *
 * ```js
 * import dropUntil from 'xstream/extra/dropUntil'
 *
 * const other = xs.periodic(220).take(1)
 *
 * const stream = xs.periodic(50)
 *   .take(6)
 *   .compose(dropUntil(other))
 *
 * stream.addListener({
 *   next: i => console.log(i),
 *   error: err => console.error(err),
 *   complete: () => console.log('completed')
 * })
 * ```
 *
 * ```text
 * > 4
 * > 5
 * > completed
 * ```
 *
 * #### Arguments:
 *
 * @param {Stream} other Some other stream that is used to know when should the
 * output stream of this operator start emitting.
 * @return {Stream}
 */
export default function dropUntil<T>(other: Stream<any>): (ins: Stream<T>) => Stream<T> {
  return function dropUntilOperator(ins: Stream<T>): Stream<T> {
    return new Stream<T>(new DropUntilOperator(other, ins));
  };
}
