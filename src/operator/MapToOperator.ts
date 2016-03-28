import {InternalListener} from '../InternalListener';
import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {emptyListener} from '../utils/emptyListener';

export class Proxy<T, R> implements InternalListener<T> {
  constructor(public out: Stream<R>,
              public op: MapToOperator<T, R>) {
  }

  _n(t: T) {
    this.out._n(this.op.projectedValue);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.out._c();
  }
}

export class MapToOperator<T, R> implements Operator<T, R> {
  public proxy: InternalListener<T> = emptyListener;

  constructor(public projectedValue: R,
              public ins: Stream<T>) {
  }

  _start(out: Stream<R>): void {
    this.ins._add(this.proxy = new Proxy(out, this));
  }

  _stop(): void {
    this.ins._remove(this.proxy);
  }
}
