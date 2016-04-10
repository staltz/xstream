import {InternalProducer} from '../InternalProducer';
import {InternalListener} from '../InternalListener';
import {Stream} from '../Stream';
import {emptyListener} from '../utils/emptyListener';

export class MergeProducer<T> implements InternalProducer<T>, InternalListener<T> {
  private out: InternalListener<T> = emptyListener;
  private ac: number; // ac is activeCount, starts initialized

  constructor(public streams: Array<Stream<T>>) {
    this.ac = streams.length;
  }

  _start(out: InternalListener<T>): void {
    this.out = out;
    const streams = this.streams;
    for (let i = streams.length - 1; i >= 0; i--) {
      streams[i]._add(this);
    }
  }

  _stop(): void {
    const streams = this.streams;
    for (let i = streams.length - 1; i >= 0; i--) {
      streams[i]._remove(this);
    }
    this.out = null;
    this.ac = streams.length;
  }

  _n(t: T) {
    this.out._n(t);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    if (--this.ac === 0) {
      this.out._c();
    }
  }
}
