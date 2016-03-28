import {InternalListener} from '../InternalListener';
import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {emptyListener} from '../utils/emptyListener';

export class Proxy<T> implements InternalListener<T> {
  constructor(private out: Stream<T>,
              private op: FilterOperator<T>) {
  }

  _n(t: T) {
    if (this.op.predicate(t)) this.out._n(t);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.out._c();
  }
}

export class FilterOperator<T> implements Operator<T, T> {
  private proxy: InternalListener<T> = emptyListener;

  constructor(public predicate: (t: T) => boolean,
              public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.ins._add(this.proxy = new Proxy(out, this));
  }

  _stop(): void {
    this.ins._remove(this.proxy);
  }
}
