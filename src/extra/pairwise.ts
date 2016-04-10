import {Operator, Stream} from '../index';

class PairwiseOperator<T> implements Operator<T, [T, T]> {
  private val: T = null;
  private has: boolean = false;
  private out: Stream<[T, T]> = null;

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
    if (this.has) {
      this.out._n([this.val, t]);
    }
    this.val = t;
    this.has = true;
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.out._c();
  }
}

export default function pairwise<T>(): (ins: Stream<T>) => Stream<[T, T]> {
  return function pairwiseOperator(ins: Stream<T>): Stream<[T, T]> {
    return new Stream<[T, T]>(new PairwiseOperator(ins));
  };
}
