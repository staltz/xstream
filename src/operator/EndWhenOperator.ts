import {InternalListener} from '../InternalListener';
import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {emptyListener} from '../utils/emptyListener';
import {empty} from '../utils/empty';

export class Proxy<T> implements InternalListener<T> {
  constructor(private out: Stream<T>,
              private prod: EndWhenOperator<T>) {
  }

  _n(t: T) {
    this.out._n(t);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.prod.end();
  }
}

export class OtherListener<T> implements InternalListener<any> {
  constructor(private out: Stream<T>,
              private prod: EndWhenOperator<T>) {
  }

  _n(t: T) {
    this.prod.end();
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.prod.end();
  }
}

export class EndWhenOperator<T> implements Operator<T, T> {
  private proxy: InternalListener<T> = emptyListener;
  private oli: InternalListener<any> = emptyListener; // oli = other listener
  private out: Stream<T> = <Stream<T>> empty;

  constructor(private o: Stream<any>, // o = other
              public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.o._add(this.oli = new OtherListener(out, this));
    this.ins._add(this.proxy = new Proxy(out, this));
  }

  _stop(): void {
    this.ins._remove(this.proxy);
  }

  end(): void {
    this.o._remove(this.oli);
    this.ins._remove(this.proxy);
    this.out._c();
    this.proxy = null;
    this.out = null;
    this.oli = null;
  }
}
