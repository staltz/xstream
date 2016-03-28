import {InternalListener} from '../InternalListener';
import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {emptyListener} from '../utils/emptyListener';

export class Proxy<T, R> implements InternalListener<T> {
  constructor(private out: Stream<R>,
              private value: R) {
  }

  _n(t: T) {
    this.out._n(this.value);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.out._c();
  }
}

export class MapToOperator<T, R> implements Operator<T, R> {
  private proxy: InternalListener<T> = emptyListener;

  constructor(private projectedValue: R,
              public ins: Stream<T>) {
  }

  _start(out: Stream<R>): void {
    this.ins._add(this.proxy = new Proxy(out, this.projectedValue));
  }

  _stop(): void {
    this.ins._remove(this.proxy);
  }
}
