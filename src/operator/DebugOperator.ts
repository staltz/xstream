import {Operator} from '../Operator';
import {Stream} from '../Stream';

export class DebugOperator<T> implements Operator<T, T> {
  private out: Stream<T> = null;

  constructor(public spy: (t: T) => any = null,
              public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = null;
  }

  _n(t: T) {
    if (this.spy) {
      try {
        this.spy(t);
      } catch (e) {
        this.out._e(e);
      }
    } else {
      console.log(t);
    }
    this.out._n(t);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.out._c();
  }
}
