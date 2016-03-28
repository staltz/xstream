import {InternalListener} from '../InternalListener';
import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {emptyListener} from '../utils/emptyListener';
import {empty} from '../utils/empty';

export class Proxy<T> implements InternalListener<T> {
  constructor(private out: Stream<T>,
              private op: LastOperator<T>) {
  }

  _n(t: T) {
    const op = this.op;
    op.has = true;
    op.val = t;
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    const op = this.op;
    const out = this.out;
    if (op.has) {
      out._n(op.val);
      out._c();
    } else {
      out._e('TODO show proper error');
    }
  }
}

export class LastOperator<T> implements Operator<T, T> {
  private proxy: InternalListener<T> = emptyListener;
  public has: boolean = false;
  public val: T = <T> empty;

  constructor(public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.ins._add(this.proxy = new Proxy(out, this));
  }

  _stop(): void {
    this.ins._remove(this.proxy);
  }
}
