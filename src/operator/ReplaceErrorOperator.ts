import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {empty} from '../utils/empty';

export class ReplaceErrorOperator<T> implements Operator<T, T> {
  private out: Stream<T> = <Stream<T>> empty;

  constructor(public fn: (err: any) => Stream<T>,
              public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
  }

  _n(t: T) {
    this.out._n(t);
  }

  _e(err: any) {
    try {
      this.ins._remove(this);
      (this.ins = this.fn(err))._add(this);
    } catch (e) {
      this.out._e(e);
    }
  }

  _c() {
    this.out._c();
  }
}
