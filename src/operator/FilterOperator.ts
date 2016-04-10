import {Operator} from '../Operator';
import {Stream} from '../Stream';

export class FilterOperator<T> implements Operator<T, T> {
  private out: Stream<T> = null;

  constructor(public predicate: (t: T) => boolean,
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
    try {
      if (this.predicate(t)) this.out._n(t);
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
