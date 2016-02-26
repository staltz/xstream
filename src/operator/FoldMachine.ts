import {Observer} from '../Observer';
import {Machine} from '../Machine';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class Proxy<T, R> implements Observer<T> {
  constructor(public out: Stream<R>,
              public machine: FoldMachine<T, R>) {
  }

  next(t: T) {
    const m = this.machine;
    this.out.next(m.acc = m.accumulate(m.acc, t));
  }

  error(err: any) {
    this.out.error(err);
  }

  complete() {
    this.out.complete();
  }
}

export class FoldMachine<T, R> implements Machine<R> {
  public proxy: Observer<T> = emptyObserver;
  public acc: R;

  constructor(public accumulate: (acc: R, t: T) => R,
              seed: R,
              public ins: Stream<T>) {
    this.acc = seed;
  }

  start(out: Stream<R>): void {
    out.next(this.acc);
    this.proxy = new Proxy(out, this);
    this.ins.subscribe(this.proxy);
  }

  stop(): void {
    this.ins.unsubscribe(this.proxy);
  }
}
