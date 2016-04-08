import {InternalListener} from '../InternalListener';
import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {emptyListener} from '../utils/emptyListener';
import {empty} from '../utils/empty';

export class Proxy<T> implements InternalListener<T> {
  constructor(private out: Stream<T>,
              private op: DropRepeatsOperator<T>) {
  }

  isEq(x: T, y: T) {
    return this.op.compare ? this.op.compare(x, y) : x === y;
  }

  _n(t: T) {
    const op = this.op;
    if (op.v === empty || !this.isEq(t, op.v)) {
      this.out._n(t);
    }
    op.v = t;
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.out._c();
  }
}

export class DropRepeatsOperator<T> implements Operator<T, T> {
  private proxy: InternalListener<T> = emptyListener;
  public v: T = <any> empty;

  constructor(public compare: (x: T, y: T) => boolean,
              public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.ins._add(this.proxy = new Proxy(out, this));
  }

  _stop(): void {
    this.ins._remove(this.proxy);
  }
}

export default function dropRepeats<T>(isEqual: (x: T, y: T) => boolean = null): (ins: Stream<T>) => Stream<T> {
  return function dropRepeatsOperator(ins: Stream<T>): Stream<T> {
    return new Stream<T>(new DropRepeatsOperator(isEqual, ins));
  };
}
