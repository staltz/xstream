import {Observer} from '../Observer';
import {Producer} from '../Producer';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class Proxy<T> implements Observer<T> {
  constructor(public out: Stream<T>,
              public prod: TakeProducer<T>) {
  }

  next(t: T) {
    const {prod, out} = this;
    if (prod.taken++ < prod.max) {
      out.next(t);
    } else {
      out.end();
      prod.stop();
    }
  }

  error(err: any) {
    this.out.error(err);
  }

  end() {
    this.out.end();
  }
}

export class TakeProducer<T> implements Producer<T> {
  public proxy: Observer<T> = emptyObserver;
  public taken: number = 0;

  constructor(public max: number,
              public ins: Stream<T>) {
  }

  start(out: Stream<T>): void {
    this.ins.subscribe(this.proxy = new Proxy(out, this));
  }

  stop(): void {
    this.ins.unsubscribe(this.proxy);
  }
}
