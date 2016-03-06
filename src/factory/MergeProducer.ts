import {Producer} from '../Producer';
import {Observer} from '../Observer';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class Proxy<T> implements Observer<T> {
  constructor(public prod: MergeProducer<T>) {
  }

  next(t: T) {
    this.prod.out.next(t);
  }

  error(err: any) {
    this.prod.out.error(err);
  }

  end() {
    const prod = this.prod;
    if (--prod.ac === 0) {
      prod.out.end();
    }
  }
}

export class MergeProducer<T> implements Producer<T> {
  public out: Observer<T> = emptyObserver;
  public ac: number; // ac is activeCount
  public proxy: Proxy<T>;

  constructor(public streams: Array<Stream<T>>) {
    this.ac = streams.length;
  }

  start(out: Observer<T>): void {
    this.out = out;
    this.proxy = new Proxy(this);
    for (let i = this.streams.length - 1; i >= 0; i--) {
      this.streams[i].subscribe(this.proxy);
    }
  }

  stop(): void {
    for (let i = this.streams.length - 1; i >= 0; i--) {
      this.streams[i].unsubscribe(this.proxy);
    }
  }
}
