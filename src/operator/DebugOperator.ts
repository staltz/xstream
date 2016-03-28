import {InternalListener} from '../InternalListener';
import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {emptyListener} from '../utils/emptyListener';

export class Proxy<T> implements InternalListener<T> {
  constructor(private out: Stream<T>,
              private op: DebugOperator<T>) {
  }

  _n(t: T) {
    if (this.op.spy) {
      this.op.spy(t);
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

export class DebugOperator<T> implements Operator<T, T> {
  private proxy: InternalListener<T> = emptyListener;

  constructor(public spy: (t: T) => void = null,
              public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.ins._add(this.proxy = new Proxy(out, this));
  }

  _stop(): void {
    this.ins._remove(this.proxy);
  }
}
