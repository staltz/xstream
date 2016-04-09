import {Operator} from '../Operator';
import {Stream} from '../Stream';

export class FoldOperator<T, R> implements Operator<T, R> {
  private out: Stream<R> = null;
  private acc: R; // initialized as seed

  constructor(public f: (acc: R, t: T) => R,
              public seed: R,
              public ins: Stream<T>) {
    this.acc = seed;
  }

  _start(out: Stream<R>): void {
    this.out = out;
    out._n(this.acc);
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
  }

  _n(t: T) {
    this.out._n(this.acc = this.f(this.acc, t));
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.out._c();
  }
}
