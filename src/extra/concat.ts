import {Stream, InternalProducer, InternalListener} from '../core';

class ConcatProducer<T> implements InternalProducer<T>, InternalListener<T> {
  private out: InternalListener<T> = null;
  private i: number = 0;

  constructor(public streams: Array<Stream<T>>) {
  }

  _start(out: InternalListener<T>): void {
    this.out = out;
    this.streams[this.i]._add(this);
  }

  _stop(): void {
    const streams = this.streams;
    if (this.i < streams.length) {
      streams[this.i]._remove(this);
    }
    this.i = 0;
    this.out = null;
  }

  _n(t: T) {
    this.out._n(t);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    const streams = this.streams;
    streams[this.i]._remove(this);
    if (++this.i < streams.length) {
      streams[this.i]._add(this);
    } else {
      this.out._c();
    }
  }
}

export default function concat<T>(...streams: Array<Stream<T>>): Stream<T> {
  return new Stream<T>(new ConcatProducer(streams));
}
