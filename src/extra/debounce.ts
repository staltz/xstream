import {Operator, Stream} from '../core';

class DebounceOperator<T> implements Operator<T, T> {
  private out: Stream<T> = null;
  private value: T = null;
  private id: any = null;

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
    this.value = null;
    this.id = null;
  }

  clearTimer() {
    const id = this.id;
    if (id !== null) {
      clearTimeout(id);
    }
    this.id = null;
  }

  _n(t: T) {
    this.value = t;
    this.clearTimer();
    this.id = setTimeout(() => this.out._n(this.value), this.dt);
  }

  _e(err: any) {
    this.clearTimer();
    this.out._e(err);
  }

  _c() {
    this.clearTimer();
    this.out._c();
  }
}

export default function debounce<T>(period: number): (ins: Stream<T>) => Stream<T> {
  return function debounceOperator(ins: Stream<T>): Stream<T> {
    throw new Error('Not implemented yet');
  };
}
