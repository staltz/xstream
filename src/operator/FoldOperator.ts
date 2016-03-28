import {InternalListener} from '../InternalListener';
import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {emptyListener} from '../utils/emptyListener';

export class Proxy<T, R> implements InternalListener<T> {
  constructor(private out: Stream<R>,
              private op: FoldOperator<T, R>) {
  }

  _n(t: T) {
    const op = this.op;
    this.out._n(op.acc = op.f(op.acc, t));
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.out._c();
  }
}

export class FoldOperator<T, R> implements Operator<T, R> {
  private proxy: InternalListener<T> = emptyListener;
  public acc: R;

  constructor(public f: (acc: R, t: T) => R,
              seed: R,
              public ins: Stream<T>) {
    this.acc = seed;
  }

  _start(out: Stream<R>): void {
    out._n(this.acc);
    this.ins._add(this.proxy = new Proxy(out, this));
  }

  _stop(): void {
    this.ins._remove(this.proxy);
  }
}
