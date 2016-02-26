import {Observer} from '../Observer';
import {Machine} from '../Machine';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class Proxy<T> implements Observer<T> {
  constructor(public out: Stream<T>,
              public machine: FilterMachine<T>) {
  }

  next(t: T) {
    if (this.machine.predicate(t)) this.out.next(t);
  }

  error(err: any) {
    this.out.error(err);
  }

  complete() {
    this.out.complete();
  }
}

export class FilterMachine<T> implements Machine<T> {
  public proxy: Observer<T> = emptyObserver;

  constructor(public predicate: (t: T) => boolean,
              public ins: Stream<T>) {
  }

  start(out: Stream<T>): void {
    this.proxy = new Proxy(out, this);
    this.ins.subscribe(this.proxy);
  }

  stop(): void {
    this.ins.unsubscribe(this.proxy);
  }
}
