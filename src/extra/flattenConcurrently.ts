import {Operator, Stream, OutSender, InternalListener} from '../core';

class FCIL<T> implements InternalListener<T>, OutSender<T> {
  constructor(public out: Stream<T>,
              private op: FlattenConcOperator<T>) {
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

export class FlattenConcOperator<T> implements Operator<Stream<T>, T> {
  public type = 'flattenConcurrently';
  private active: number = 1; // number of outers and inners that have not yet ended
  public out: Stream<T> = null as any;

  constructor(public ins: Stream<Stream<T>>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.active = 1;
    this.out = null as any;
  }

  less(): void {
    if (--this.active === 0) {
      const u = this.out;
      if (!u) return;
      u._c();
    }
  }

  _n(s: Stream<T>) {
    const u = this.out;
    if (!u) return;
    this.active++;
    s._add(new FCIL(u, this));
  }

  _e(err: any) {
    const u = this.out;
    if (!u) return;
    u._e(err);
  }

  _c() {
    this.less();
  }
}

/**
 * Flattens a "stream of streams", handling multiple concurrent nested streams
 * simultaneously.
 *
 * If the input stream is a stream that emits streams, then this operator will
 * return an output stream which is a flat stream: emits regular events. The
 * flattening happens concurrently. It works like this: when the input stream
 * emits a nested stream, *flattenConcurrently* will start imitating that
 * nested one. When the next nested stream is emitted on the input stream,
 * *flattenConcurrently* will also imitate that new one, but will continue to
 * imitate the previous nested streams as well.
 *
 * Marble diagram:
 *
 * ```text
 * --+--------+---------------
 *   \        \
 *    \       ----1----2---3--
 *    --a--b----c----d--------
 *     flattenConcurrently
 * -----a--b----c-1--d-2---3--
 * ```
 *
 * @return {Stream}
 */
export default function flattenConcurrently<T>(ins: Stream<Stream<T>>): Stream<T> {
  return new Stream<T>(new FlattenConcOperator(ins));
}
