import {Operator, InternalListener, Stream, OutSender, NO_IL} from '../core';

class SeparatorIL<T> implements InternalListener<any>, OutSender<Stream<T>> {
  constructor(public out: Stream<Stream<T>>,
              private op: SplitOperator<T>) {
  }

  _n(t: any) {
    this.op.up();
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.op.curr._c();
    this.out._c();
  }
}

export class SplitOperator<T> implements Operator<T, Stream<T>> {
  public type = 'split';
  public curr: Stream<T> = new Stream<T>();
  public out: Stream<Stream<T>> = null;
  private sil: InternalListener<any> = NO_IL; // sil = separator InternalListener

  constructor(public s: Stream<any>, // s = separator
              public ins: Stream<T>) {
  }

  _start(out: Stream<Stream<T>>): void {
    this.out = out;
    this.s._add(this.sil = new SeparatorIL<T>(out, this));
    this.ins._add(this);
    out._n(this.curr);
  }

  _stop(): void {
    this.ins._remove(this);
    this.s._remove(this.sil);
    this.curr = new Stream<T>();
    this.out = null;
    this.sil = NO_IL;
  }

  up(): void {
    this.curr._c();
    this.out._n(this.curr = new Stream<T>());
  }

  _n(t: T) {
    if (!this.out) return;
    this.curr._n(t);
  }

  _e(err: any) {
    const u = this.out;
    if (!u) return;
    u._e(err);
  }

  _c() {
    const u = this.out;
    if (!u) return;
    this.curr._c();
    u._c();
  }
}

/**
 * Splits a stream using a separator stream. Returns a stream that emits
 * streams.
 *
 * Marble diagram:
 *
 * ```text
 * --1--2--3--4--5--6--7--8--9|
 *  split( --a----b--- )
 * ---------------------------|
 *   :        :    :
 *   1--2--3-|:    :
 *            4--5|:
 *                 -6--7--8--9|
 * ```
 *
 * Example:
 *
 * ```js
 * import split from 'xstream/extra/split'
 * import concat from 'xstream/extra/concat'
 *
 * const source = xs.periodic(50).take(10)
 * const separator = concat(xs.periodic(167).take(2), xs.never())
 * const result = source.compose(split(separator))
 *
 * result.addListener({
 *   next: stream => {
 *     stream.addListener({
 *       next: i => console.log(i),
 *       error: err => console.error(err),
 *       complete: () => console.log('inner completed')
 *     })
 *   },
 *   error: err => console.error(err),
 *   complete: () => console.log('outer completed')
 * })
 * ```
 *
 * ```text
 * > 0
 * > 1
 * > 2
 * > inner completed
 * > 3
 * > 4
 * > 5
 * > inner completed
 * > 6
 * > 7
 * > 8
 * > 9
 * > inner completed
 * > outer completed
 * ```
 *
 * @param {Stream} separator Some other stream that is used to know when to
 * split the output stream.
 * @return {Stream}
 */
export default function split<T>(separator: Stream<any>): (ins: Stream<T>) => Stream<Stream<T>> {
  return function splitOperator(ins: Stream<T>): Stream<Stream<T>> {
    return new Stream<Stream<T>>(new SplitOperator(separator, ins));
  };
}
