import {Operator, Stream, InternalListener} from '../core';

class FSInner<T> implements InternalListener<T> {
  constructor(private out: Stream<T>,
              private op: FlattenSeqOperator<T>) {
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

export class FlattenSeqOperator<T> implements Operator<Stream<T>, T> {
  public type = 'flattenSequentially';
  public ins: Stream<Stream<T>>;
  private open: boolean;
  private active: boolean;
  private seq: Array<Stream<T>>;
  public out: Stream<T>;

  constructor(ins: Stream<Stream<T>>) {
    this.ins = ins;
    this.out = null as any;
    this.open = true;
    this.active = false;
    this.seq = [];
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.open = true;
    this.active = false;
    this.seq = [];
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.open = true;
    this.active = false;
    this.seq = [];
    this.out = null as any;
  }

  less(): void {
    this.active = false;
    const seq = this.seq;
    if (seq.length > 0) {
      this._n(seq.shift() as Stream<T>);
    }
    if (!this.open && !this.active) {
      this.out._c();
    }
  }

  _n(s: Stream<T>) {
    const u = this.out;
    if (!u) return;
    if (this.active) {
      this.seq.push(s);
    } else {
      this.active = true;
      s._add(new FSInner(u, this));
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
    this.open = false;
    if (!this.active && this.seq.length === 0) {
      u._c();
    }
  }
}

/**
 * Flattens a "stream of streams", handling only one nested stream at a time,
 * with no concurrency, but does not drop nested streams like `flatten` does.
 *
 * If the input stream is a stream that emits streams, then this operator will
 * return an output stream which is a flat stream: emits regular events. The
 * flattening happens sequentially and without concurrency. It works like this:
 * when the input stream emits a nested stream, *flattenSequentially* will start
 * imitating that nested one. When the next nested stream is emitted on the
 * input stream, *flattenSequentially* will keep that in a buffer, and only
 * start imitating it once the previous nested stream completes.
 *
 * In essence, `flattenSequentially` concatenates all nested streams.
 *
 * Marble diagram:
 *
 * ```text
 * --+--------+-------------------------
 *   \        \
 *    \       ----1----2---3--|
 *    --a--b----c----d--|
 *          flattenSequentially
 * -----a--b----c----d------1----2---3--
 * ```
 *
 * @return {Stream}
 */
export default function flattenSequentially<T>(ins: Stream<Stream<T>>): Stream<T> {
  return new Stream<T>(new FlattenSeqOperator(ins));
}
