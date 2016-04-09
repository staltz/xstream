import {Operator} from '../Operator';
import {Stream} from '../Stream';

export class TakeOperator<T> implements Operator<T, T> {
  private out: Stream<T> = null;
  private taken: number = 0;

  constructor(public max: number,
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
    const out = this.out;
    if (this.taken++ < this.max - 1) {
      out._n(t);
    } else {
      out._n(t);
      out._c();
      this._stop();
    }
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.out._c();
  }
}
