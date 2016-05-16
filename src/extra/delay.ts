import {Operator, Stream} from '../core';

class DelayOperator<T> implements Operator<T, T> {
  public type = 'delay';
  private out: Stream<T> = null;

  constructor(public dt: number,
              public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = null;
  }

  _n(t: T) {
    const u = this.out;
    if (!u) return;
    const id = setInterval(() => {
      u._n(t);
      clearInterval(id);
    }, this.dt);
  }

  _e(err: any) {
    const u = this.out;
    if (!u) return;
    const id = setInterval(() => {
      u._e(err);
      clearInterval(id);
    }, this.dt);
  }

  _c() {
    const u = this.out;
    if (!u) return;
    const id = setInterval(() => {
      u._c();
      clearInterval(id);
    }, this.dt);
  }
}

export default function delay<T>(period: number): (ins: Stream<T>) => Stream<T> {
  return function delayOperator(ins: Stream<T>): Stream<T> {
    return new Stream<T>(new DelayOperator(period, ins));
  };
}
