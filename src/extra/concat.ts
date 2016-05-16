import {Stream, InternalProducer, InternalListener} from '../core';

class ConcatProducer<T> implements InternalProducer<T>, InternalListener<T> {
  public type = 'concat';
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
    const u = this.out;
    if (!u) return;
    u._n(t);
  }

  _e(err: any) {
    const u = this.out;
    if (!u) return;
    u._e(err);
  }

  _c() {
    const u = this.out;
    if (!u) return;
    const streams = this.streams;
    streams[this.i]._remove(this);
    if (++this.i < streams.length) {
      streams[this.i]._add(this);
    } else {
      u._c();
    }
  }
}

export default function concat<T>(...streams: Array<Stream<T>>): Stream<T> {
  return new Stream<T>(new ConcatProducer(streams));
}
