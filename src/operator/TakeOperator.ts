import {InternalListener} from '../InternalListener';
import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {emptyListener} from '../utils/emptyListener';

export class Proxy<T> implements InternalListener<T> {
  constructor(public out: Stream<T>,
              public prod: TakeOperator<T>) {
  }

  _n(t: T) {
    const {prod, out} = this;
    if (prod.taken++ < prod.max - 1) {
      out._n(t);
    } else {
      out._n(t);
      out._c();
      prod._stop();
    }
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.out._c();
  }
}

export class TakeOperator<T> implements Operator<T, T> {
  public proxy: InternalListener<T> = emptyListener;
  public taken: number = 0;

  constructor(public max: number,
              public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.ins._add(this.proxy = new Proxy(out, this));
  }

  _stop(): void {
    this.ins._remove(this.proxy);
  }
}
