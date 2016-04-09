import {Operator} from '../Operator';
import {Stream} from '../Stream';

export class MapOperator<T, R> implements Operator<T, R> {
  private out: Stream<R> = null;

  constructor(public project: (t: T) => R,
              public ins: Stream<T>) {
  }

  _start(out: Stream<R>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
  }

  _n(t: T) {
    this.out._n(this.project(t));
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.out._c();
  }
}
