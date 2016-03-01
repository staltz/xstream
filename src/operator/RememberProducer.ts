import {Observer} from '../Observer';
import {Producer} from '../Producer';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class Proxy<T> implements Observer<T> {
  constructor(public out: Stream<T>,
              public p: RememberProducer<T>) {
  }

  next(t: T) {
    this.out.next(t);
    this.out._val = t;
  }

  error(err: any) {
    this.out.error(err);
  }

  end() {
    this.out.end();
  }
}

export class RememberProducer<T> implements Producer<T> {
  public proxy: Observer<T> = emptyObserver;
  public value: any;

  constructor(public ins: Stream<T>) {
  }

  start(out: Stream<T>): void {
    this.ins.subscribe(this.proxy = new Proxy(out, this));
  }

  stop(): void {
    this.ins.unsubscribe(this.proxy);
  }
}
