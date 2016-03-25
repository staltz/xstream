import {Producer} from '../Producer';
import {Listener} from '../Listener';
import {Stream} from '../Stream';
import {emptyListener} from '../utils/emptyListener';

export class Proxy<T> implements Listener<T> {
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
  public out: Listener<T> = emptyListener;
  public ac: number; // ac is activeCount
  public proxy: Proxy<T>;

  constructor(public streams: Array<Stream<T>>) {
    this.ac = streams.length;
  }

  start(out: Listener<T>): void {
    this.out = out;
    this.proxy = new Proxy(this);
    for (let i = this.streams.length - 1; i >= 0; i--) {
      this.streams[i].addListener(this.proxy);
    }
  }

  stop(): void {
    for (let i = this.streams.length - 1; i >= 0; i--) {
      this.streams[i].removeListener(this.proxy);
    }
  }
}
