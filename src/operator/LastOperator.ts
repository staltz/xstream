import {InternalListener} from '../InternalListener';
import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {emptyListener} from '../utils/emptyListener';
import {empty} from '../utils/empty';

export class Proxy<T> implements InternalListener<T> {
  constructor(public out: Stream<T>,
              public p: LastOperator<T>) {
  }

  _n(t: T) {
    const p = this.p;
    p.has = true;
    p.val = t;
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    const p = this.p;
    const out = this.out;
    if (p.has) {
      out._n(p.val);
      out._c();
    } else {
      out._e('TODO show proper error');
    }
  }
}

export class LastOperator<T> implements Operator<T, T> {
  public proxy: InternalListener<T> = emptyListener;
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
