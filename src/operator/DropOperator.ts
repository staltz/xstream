import {Operator} from '../Operator';
import {Stream} from '../Stream';

export class DropOperator<T> implements Operator<T, T> {
  private out: Stream<T> = null;
  private dropped: number = 0;

  constructor(public max: number,
              public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = null;
    this.dropped = 0;
  }

  _n(t: T) {
    if (this.dropped++ >= this.max) this.out._n(t);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.out._c();
  }
}
