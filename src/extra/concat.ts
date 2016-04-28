import {Stream, InternalProducer, InternalListener} from '../core';

class ConcatListener<T> implements InternalListener<T> {
  constructor(private out: InternalListener<T>,
              private p: ConcatProducer<T>) {
  }

  _n(t: T) {
    this.out._n(t);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.p.less();
  }
}

class ConcatProducer<T> implements InternalProducer<T> {
  private out: InternalListener<T> = null;
  private li: ConcatListener<T> = null;
  private i: number = 0;

  constructor(public streams: Array<Stream<T>>) {
  }

  _start(out: InternalListener<T>): void {
    this.out = out;
    this.streams[this.i]._add(this.li = new ConcatListener(out, this));
  }

  _stop(): void {
    const streams = this.streams;
    if (this.i < streams.length) {
      streams[this.i]._remove(this.li);
    }
    this.out = null;
    this.li = null;
    this.i = 0;
  }

  less() {
    const streams = this.streams;
    const out = this.out;
    streams[this.i]._remove(this.li);
    if (++this.i < streams.length) {
      streams[this.i]._add(this.li = new ConcatListener(out, this));
    } else {
      out._c();
    }
  }
}

export default function concat<T>(...streams: Array<Stream<T>>): Stream<T> {
  return new Stream<T>(new ConcatProducer(streams));
}
