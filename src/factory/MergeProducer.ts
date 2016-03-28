import {InternalProducer} from '../InternalProducer';
import {InternalListener} from '../InternalListener';
import {Stream} from '../Stream';
import {emptyListener} from '../utils/emptyListener';

export class Proxy<T> implements InternalListener<T> {
  constructor(private prod: MergeProducer<T>) {
  }

  _n(t: T) {
    this.prod.out._n(t);
  }

  _e(err: any) {
    this.prod.out._e(err);
  }

  _c() {
    const prod = this.prod;
    if (--prod.ac === 0) {
      prod.out._c();
    }
  }
}

export class MergeProducer<T> implements InternalProducer<T> {
  public out: InternalListener<T> = emptyListener;
  public ac: number; // ac is activeCount
  private proxy: Proxy<T>;

  constructor(private streams: Array<Stream<T>>) {
    this.ac = streams.length;
  }

  _start(out: InternalListener<T>): void {
    this.out = out;
    this.proxy = new Proxy(this);
    for (let i = this.streams.length - 1; i >= 0; i--) {
      this.streams[i]._add(this.proxy);
    }
  }

  _stop(): void {
    for (let i = this.streams.length - 1; i >= 0; i--) {
      this.streams[i]._remove(this.proxy);
    }
  }
}
