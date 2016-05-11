import {Operator, InternalListener, Stream, emptyListener} from '../core';

class SeparatorIL<T> implements InternalListener<any> {
  constructor(private out: Stream<Stream<T>>,
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
  private out: Stream<Stream<T>> = null;
  private sil: InternalListener<any> = emptyListener; // sil = separator InternalListener

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
    this.sil = emptyListener;
  }

  up(): void {
    this.curr._c();
    this.out._n(this.curr = new Stream<T>());
  }

  _n(t: T) {
    this.curr._n(t);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.curr._c();
    this.out._c();
  }
}

export default function split<T>(separator: Stream<any>): (ins: Stream<T>) => Stream<Stream<T>> {
  return function splitOperator(ins: Stream<T>): Stream<Stream<T>> {
    return new Stream<Stream<T>>(new SplitOperator(separator, ins));
  };
}
