import {Observer} from '../Observer';
import {Producer} from '../Producer';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class Proxy<T> implements Observer<T> {
  constructor(public out: Stream<T>,
              public p: LastProducer<T>) {
  }

  next(t: T) {
    const p = this.p;
    p.has = true;
    p.val = t;
  }

  error(err: any) {
    this.out.error(err);
  }

  complete() {
    const p = this.p;
    const out = this.out;
    if (p.has) {
      out.next(p.val);
      out.complete();
    } else {
      out.error('TODO show proper error');
    }
  }
}

export class LastProducer<T> implements Producer<T> {
  public proxy: Observer<T> = emptyObserver;
  public has: boolean = false;
  public val: T = <T> {};

  constructor(public ins: Stream<T>) {
  }

  start(out: Stream<T>): void {
    this.proxy = new Proxy(out, this);
    this.ins.subscribe(this.proxy);
  }

  stop(): void {
    this.ins.unsubscribe(this.proxy);
  }
}
