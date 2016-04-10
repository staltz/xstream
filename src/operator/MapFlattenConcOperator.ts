import {InternalProducer} from '../InternalProducer';
import {InternalListener} from '../InternalListener';
import {Stream} from '../Stream';
import {MapOperator} from './MapOperator';

export class Inner<T> implements InternalListener<T> {
  constructor(private out: Stream<T>,
              private op: MapFlattenConcOperator<T>) {
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

export class MapFlattenConcOperator<T> implements InternalProducer<T>, InternalListener<T> {
  private active: number = 1; // number of outers and inners that have not yet ended
  private out: Stream<T> = null;

  constructor(public mapOp: MapOperator<T, Stream<T>>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.mapOp.ins._add(this);
  }

  _stop(): void {
    this.mapOp.ins._remove(this);
    this.active = 1;
    this.out = null;
  }

  less(): void {
    if (--this.active === 0) {
      this.out._c();
    }
  }

  _n(v: T) {
    this.active++;
    try {
      this.mapOp.project(v)._add(new Inner(this.out, this));
    } catch (e) {
      this.out._e(e);
    }
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.less();
  }
}
