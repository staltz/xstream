import {Operator, Stream, OutSender, InternalListener} from '../index';

class FCAMIL<T> implements InternalListener<T>, OutSender<T> {
  constructor(public out: Stream<T>,
              private op: FlattenConcAMOperator<T>) {
  }

  _n(t: T) {
    this.out._n(t);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.op.less();
  }
}

export class FlattenConcAMOperator<T> implements Operator<Stream<T>, T> {
  public type = 'flattenConcurrentlyAtMost';
  public out: Stream<T> = null as any;
  private _l: number = 0;
  private _d: boolean = false;
  private _seq: Array<Stream<T>> = [];

  constructor(public n: number, public ins: Stream<Stream<T>>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this._l = 0;
    this.out = null as any;
    this._seq = [];
  }

  less(): void {
    const seq = this._seq;
    if (--this._l === 0 && seq.length === 0 && this._d) {
      const u = this.out;
      if (!u) return;
      u._c();
    }
    if (this._l < this.n && seq.length > 0) {
      this._n(seq.shift() as Stream<T>);
    }
  }

  _n(s: Stream<T>) {
    const u = this.out;
    if (!u) return;
    if (this._l < this.n) {
      this._l++;
      s._add(new FCAMIL(u, this));
    } else {
      this._seq.push(s);
    }
  }

  _e(err: any) {
    const u = this.out;
    if (!u) return;
    u._e(err);
  }

  _c() {
    const seq = this._seq;
    this._d = true;
    if (this._l === 0 && seq.length === 0) {
      const u = this.out;
      if (!u) return;
      u._c();
    }
  }
}

/**
 * Flattens a "stream of streams", handling multiple concurrent nested streams
 * simultaneously, up to some limit `n`.
 *
 * If the input stream is a stream that emits streams, then this operator will
 * return an output stream which is a flat stream: emits regular events. The
 * flattening happens concurrently, up to the configured limit. It works like
 * this: when the input stream emits a nested stream,
 * *flattenConcurrentlyAtMost* will start imitating that nested one. When the
 * next nested stream is emitted on the input stream,
 * *flattenConcurrentlyAtMost* will check to see how many streams it is connected
 * to. If it is connected to a number of streams less than the limit, it will also
 * imitate that new one, but will continue to imitate the previous nested streams
 * as well.
 *
 * If the limit has already been reached, *flattenConcurrentlyAtMost* will put the
 * stream in a queue. When any of the streams it is listening to completes, a stream
 * is taken out of the queue and `flattenConcurrentlyAtMost` will connect to it.
 *
 * This process continues until the metastream completes and there are no more
 * connected streams or streams in the queue.
 *
 * Marble diagrams:
 *
 * ```text
 * --+--------+---------------
 *   \        \
 *    \       ----1----2---3--|
 *    --a--b----c----|
 *     flattenConcurrentlyAtMost(1)
 * -----a--b----c-1----2---3--|
 * ```
 *
 * ```text
 * --+---+---+-|
 *    \   \   \
 *     \   \   ---fgh----i-----jh--|
 *      \   -----1----2----3--|
 *       ---a--b-----c--|
 *     flattenConcurrentlyAtMost(2)
 * ---------a--b-1---c2--i-3------fgh----i-----jh--|
 * ```
 *
 * @return {Stream}
 */
export default function flattenConcurrentlyAtMost<T>(n: number): (ins: Stream<Stream<T>>) => Stream<T> {
  return function flattenConcAMOperator(ins: Stream<Stream<T>>) {
    return new Stream<T>(new FlattenConcAMOperator(n, ins));
  };
}
