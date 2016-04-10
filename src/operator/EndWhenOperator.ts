import {InternalListener} from '../InternalListener';
import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {emptyListener} from '../utils/emptyListener';

export class OtherListener<T> implements InternalListener<any> {
  constructor(private out: Stream<T>,
              private op: EndWhenOperator<T>) {
  }

  _n(t: T) {
    this.op.end();
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.op.end();
  }
}

export class EndWhenOperator<T> implements Operator<T, T> {
  private out: Stream<T> = null;
  private oli: InternalListener<any> = emptyListener; // oli = other listener

  constructor(public o: Stream<any>, // o = other
              public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.o._add(this.oli = new OtherListener(out, this));
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.o._remove(this.oli);
    this.out = null;
    this.oli = null;
  }

  end(): void {
    this.out._c();
  }

  _n(t: T) {
    this.out._n(t);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.end();
  }
}
