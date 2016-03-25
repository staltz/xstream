import {Listener} from '../Listener';
import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {emptyListener} from '../utils/emptyListener';
import {empty} from '../utils/empty';

export class Proxy<T> implements Listener<T> {
  constructor(public out: Stream<T>,
              public p: LastOperator<T>) {
  }

  next(t: T) {
    const p = this.p;
    p.has = true;
    p.val = t;
  }

  error(err: any) {
    this.out.error(err);
  }

  end() {
    const p = this.p;
    const out = this.out;
    if (p.has) {
      out.next(p.val);
      out.end();
    } else {
      out.error('TODO show proper error');
    }
  }
}

export class LastOperator<T> implements Operator<T, T> {
  public proxy: Listener<T> = emptyListener;
  public has: boolean = false;
  public val: T = <T> empty;

  constructor(public ins: Stream<T>) {
  }

  start(out: Stream<T>): void {
    this.ins.addListener(this.proxy = new Proxy(out, this));
  }

  stop(): void {
    this.ins.removeListener(this.proxy);
  }
}
