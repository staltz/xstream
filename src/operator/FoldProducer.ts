import {Observer} from '../Observer';
import {Producer} from '../Producer';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class Proxy<T, R> implements Observer<T> {
  constructor(public out: Stream<R>,
              public p: FoldProducer<T, R>) {
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

export class FoldProducer<T, R> implements Producer<R> {
  public proxy: Observer<T> = emptyObserver;
  public acc: R;

  constructor(public a: (acc: R, t: T) => R,
              seed: R,
              public ins: Stream<T>) {
    this.acc = seed;
  }

  start(out: Stream<R>): void {
    out.next(this.acc);
    this.ins.subscribe(this.proxy = new Proxy(out, this));
  }

  stop(): void {
    this.ins.unsubscribe(this.proxy);
  }
}
