import {Operator, Stream} from '../index';
const empty = {};

export class DropRepeatsOperator<T> implements Operator<T, T> {
  private out: Stream<T> = null;
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
    const v = this.v;
    if (v === empty || !this.isEq(t, v)) {
      this.out._n(t);
    }
    this.v = t;
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.out._c();
  }
}

export default function dropRepeats<T>(isEqual: (x: T, y: T) => boolean = null): (ins: Stream<T>) => Stream<T> {
  return function dropRepeatsOperator(ins: Stream<T>): Stream<T> {
    return new Stream<T>(new DropRepeatsOperator(isEqual, ins));
  };
}
