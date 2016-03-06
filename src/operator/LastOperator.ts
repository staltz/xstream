import {Observer} from '../Observer';
import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';
import {empty} from '../utils/empty';

export class Proxy<T> implements Observer<T> {
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
  public proxy: Observer<T> = emptyObserver;
  public has: boolean = false;
  public val: T = <T> empty;

  constructor(public ins: Stream<T>) {
  }

  start(out: Stream<T>): void {
    this.ins.subscribe(this.proxy = new Proxy(out, this));
  }

  stop(): void {
    this.ins.unsubscribe(this.proxy);
  }
}
