import {Observer} from '../Observer';
import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class Proxy<T, R> implements Observer<T> {
  constructor(public out: Stream<R>,
              public p: FoldOperator<T, R>) {
  }

  next(t: T) {
    const p = this.p;
    this.out.next(p.acc = p.a(p.acc, t));
  }

  error(err: any) {
    this.out.error(err);
  }

  end() {
    this.out.end();
  }
}

export class FoldOperator<T, R> implements Operator<T, R> {
  public proxy: Observer<T> = emptyObserver;
  public acc: R;

  constructor(public a: (acc: R, t: T) => R,
              seed: R,
              public ins: Stream<T>) {
    this.acc = seed;
  }

  start(out: Stream<R>): void {
    out.next(this.acc);
    this.ins.addListener(this.proxy = new Proxy(out, this));
  }

  stop(): void {
    this.ins.removeListener(this.proxy);
  }
}
