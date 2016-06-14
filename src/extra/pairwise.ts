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
      u._n([this.val, t]);
    }
    this.val = t;
    this.has = true;
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

export default function pairwiseOperator<T>(ins: Stream<T>): Stream<[T, T]> {
  return new Stream<[T, T]>(new PairwiseOperator(ins));
}
