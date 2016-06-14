import {Operator, Stream} from '../core';
const empty = {};

export class DropRepeatsOperator<T> implements Operator<T, T> {
  public type = 'dropRepeats';
  public out: Stream<T> = null;
  private v: T = <any> empty;

  constructor(public fn: (x: T, y: T) => boolean,
              public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = null;
    this.v = <any> empty;
  }

  isEq(x: T, y: T) {
    return this.fn ? this.fn(x, y) : x === y;
  }

  _n(t: T) {
    const u = this.out;
    if (!u) return;
    const v = this.v;
    if (v === empty || !this.isEq(t, v)) {
      u._n(t);
    }
    this.v = t;
  }

  _e(err: any) {
    const u = this.out;
    if (!u) return;
    u._e(err);
  }

  _c() {
    const u = this.out;
    if (!u) return;
    u._c();
  }
}

export default function dropRepeats<T>(isEqual: (x: T, y: T) => boolean = null): (ins: Stream<T>) => Stream<T> {
  return function dropRepeatsOperator(ins: Stream<T>): Stream<T> {
    return new Stream<T>(new DropRepeatsOperator(isEqual, ins));
  };
}
