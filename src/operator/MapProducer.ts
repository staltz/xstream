import {Observer} from '../Observer';
import {Producer} from '../Producer';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class Proxy<T, U> implements Observer<T> {
  constructor(public out: Stream<U>,
              public p: MapProducer<T, U>) {
  }

  next(t: T) {
    this.out.next(this.p.project(t));
  }

  error(err: any) {
    this.out.error(err);
  }

  complete() {
    this.out.complete();
  }
}

export class MapProducer<T, U> implements Producer<U> {
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
