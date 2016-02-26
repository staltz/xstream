import {Observer} from '../Observer';
import {Machine} from '../Machine';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class Proxy<T> implements Observer<T> {
  constructor(public out: Stream<T>,
              public machine: LastMachine<T>) {
  }

  next(t: T) {
    const m = this.machine;
    m.has = true;
    m.val = t;
  }

  error(err: any) {
    this.out.error(err);
  }

  complete() {
    const m = this.machine;
    const out = this.out;
    if (m.has) {
      out.next(m.val);
      out.complete();
    } else {
      out.error('TODO show proper error');
    }
  }
}

export class LastMachine<T> implements Machine<T> {
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
