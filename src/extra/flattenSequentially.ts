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
  private open: boolean = true;
  private active: boolean = false;
  private seq: Array<Stream<T>> = [];
  private out: Stream<T> = null;

  constructor(public ins: Stream<Stream<T>>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.open = true;
    this.active = false;
    this.seq = [];
    this.out = null;
  }

  less(): void {
    this.active = false;
    const seq = this.seq;
    if (seq.length > 0) {
      this._n(seq.shift());
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
    if (this.seq.length === 0) {
      u._c();
    }
  }
}

export default function flattenSequentially<T>(): (ins: Stream<Stream<T>>) => Stream<T> {
  return function flattenSequentiallyOperator(ins: Stream<Stream<T>>): Stream<T> {
    return new Stream<T>(new FlattenSeqOperator(ins));
  };
}
