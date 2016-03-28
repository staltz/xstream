import {InternalListener} from '../InternalListener';
import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {emptyListener} from '../utils/emptyListener';

export class Proxy<T> implements InternalListener<T> {
  private value: T;
  private id: any = null;
  constructor(private out: Stream<T>,
              private period: number) {
  }

  clearTimer() {
    if (this.id !== null) {
      clearTimeout(this.id);
    }
    this.id = null;
  }

  _n(t: T) {
    this.value = t;
    this.clearTimer();
    this.id = setTimeout(() => this.out._n(this.value), this.period);
  }

  _e(err: any) {
    this.clearTimer();
    this.out._e(err);
  }

  _c() {
    this.clearTimer();
    this.out._c();
  }

}

export class DebounceOperator<T> implements Operator<T, T> {
  private proxy: InternalListener<T> = emptyListener;

  constructor(private period: number,
              public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.ins._add(this.proxy = new Proxy(out, this.period));
  }

  _stop(): void {
    this.ins._remove(this.proxy);
  }
}
