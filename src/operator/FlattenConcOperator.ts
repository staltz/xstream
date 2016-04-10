import {InternalListener} from '../InternalListener';
import {Operator} from '../Operator';
import {Stream} from '../Stream';

export class Inner<T> implements InternalListener<T> {
  constructor(private out: Stream<T>,
              private op: FlattenConcOperator<T>) {
  }

  _n(t: T) {
    this.out._n(t);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.op.less();
  }
}

export class FlattenConcOperator<T> implements Operator<Stream<T>, T> {
  private active: number = 1; // number of outers and inners that have not yet ended
  private out: Stream<T> = null;

  constructor(public ins: Stream<Stream<T>>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.active = 1;
    this.out = null;
  }

  less(): void {
    if (--this.active === 0) {
      this.out._c();
    }
  }

  _n(s: Stream<T>) {
    this.active++;
    s._add(new Inner(this.out, this));
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.less();
  }
}
