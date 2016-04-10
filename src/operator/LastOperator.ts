import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {empty} from '../utils/empty';

export class LastOperator<T> implements Operator<T, T> {
  private out: Stream<T> = null;
  private has: boolean = false;
  private val: T = <T> empty;

  constructor(public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = null;
    this.has = false;
    this.val = <T> empty;
  }

  _n(t: T) {
    this.has = true;
    this.val = t;
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    const out = this.out;
    if (this.has) {
      out._n(this.val);
      out._c();
    } else {
      out._e('TODO show proper error');
    }
  }
}
