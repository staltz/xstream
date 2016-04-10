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
    this.out = null;
    this.acc = this.seed;
  }

  _n(t: T) {
    try {
      this.out._n(this.acc = this.f(this.acc, t));
    } catch (e) {
      this.out._e(e);
    }
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.out._c();
  }
}
