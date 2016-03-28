import {InternalListener} from '../InternalListener';
import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {emptyListener} from '../utils/emptyListener';
import {MapOperator} from './MapOperator';

export class Inner<T> implements InternalListener<T> {
  constructor(private out: Stream<T>,
              private op: FlattenConcurrentlyOperator<T>) {
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

export class Outer<T> implements InternalListener<Stream<T>> {
  constructor(private out: Stream<T>,
              private op: FlattenConcurrentlyOperator<T>) {
  }

  _n(s: Stream<T>) {
    this.op.active++;
    s._add(new Inner(this.out, this.op));
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.op.less();
  }
}

export class MapOuter<T> implements InternalListener<T> {
  constructor(private out: Stream<T>,
              private pr: (t: T) => Stream<T>,
              private op: FlattenConcurrentlyOperator<T>) { // pr = project
  }

  _n(v: T) {
    this.op.active++;
    this.pr(v)._add(new Inner(this.out, this.op));
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.op.less();
  }
}

export class FlattenConcurrentlyOperator<T> implements Operator<Stream<T>, T> {
  private proxy: InternalListener<T | Stream<T>> = emptyListener;
  private mapOp: MapOperator<T, Stream<T>>;
  public active: number = 1; // number of outers and inners that have not yet ended
  private out: Stream<T>;

  constructor(public ins: Stream<Stream<T>>) {
    if (ins['_prod'] instanceof MapOperator) { // yeah I know _prod is private, who cares
      this.mapOp = <MapOperator<T, Stream<T>>> ins['_prod'];
    }
  }

  _start(out: Stream<T>): void {
    this.out = out;
    const mapOp = this.mapOp;
    if (mapOp) {
      mapOp.ins._add(this.proxy = new MapOuter(out, mapOp.project, this));
    } else {
      this.ins._add(this.proxy = new Outer(out, this));
    }
  }

  _stop(): void {
    this.ins._remove(this.proxy);
  }

  less(): void {
    this.active--;
    if (this.active === 0) {
      this.out._c();
    }
  }
}
