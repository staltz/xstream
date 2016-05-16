import {Operator, Stream} from '../core';

class DebounceOperator<T> implements Operator<T, T> {
  public type = 'debounce';
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
    const u = this.out;
    if (!u) return;
    this.value = t;
    this.clearTimer();
    this.id = setTimeout(() => u._n(t), this.dt);
  }

  _e(err: any) {
    const u = this.out;
    if (!u) return;
    this.clearTimer();
    u._e(err);
  }

  _c() {
    const u = this.out;
    if (!u) return;
    this.clearTimer();
    u._c();
  }
}

export default function debounce<T>(period: number): (ins: Stream<T>) => Stream<T> {
  return function debounceOperator(ins: Stream<T>) {
    return new Stream<T>(new DebounceOperator(period, ins));
  };
}
