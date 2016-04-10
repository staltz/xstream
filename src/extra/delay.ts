import {Operator, Stream} from '../core';

class DelayOperator<T> implements Operator<T, T> {
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
    const self = this;
    const id = setInterval(() => {
      self.out._n(t);
      clearInterval(id);
    }, this.dt);
  }

  _e(err: any) {
    const self = this;
    const id = setInterval(() => {
      self.out._e(err);
      clearInterval(id);
    }, this.dt);
  }

  _c() {
    const self = this;
    const id = setInterval(() => {
      self.out._c();
      clearInterval(id);
    }, this.dt);
  }
}

export default function delay<T>(period: number): (ins: Stream<T>) => Stream<T> {
  return function delayOperator(ins: Stream<T>): Stream<T> {
    return new Stream<T>(new DelayOperator(period, ins));
  };
}
