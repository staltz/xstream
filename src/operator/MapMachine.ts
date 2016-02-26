import {Observer} from '../Observer';
import {Machine} from '../Machine';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class Proxy<T, U> implements Observer<T> {
  constructor(public out: Stream<U>,
              public machine: MapMachine<T, U>) {
  }

  next(t: T) {
    this.out.next(this.machine.project(t));
  }

  error(err: any) {
    this.out.error(err);
  }

  complete() {
    this.out.complete();
  }
}

export class MapMachine<T, U> implements Machine<U> {
  public proxy: Observer<T> = emptyObserver;

  constructor(public project: (t: T) => U,
              public ins: Stream<T>) {
  }

  start(out: Stream<U>): void {
    this.proxy = new Proxy(out, this);
    this.ins.subscribe(this.proxy);
  }

  stop(): void {
    this.ins.unsubscribe(this.proxy);
  }
}
