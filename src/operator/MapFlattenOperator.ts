import {InternalProducer} from '../InternalProducer';
import {InternalListener} from '../InternalListener';
import {Stream} from '../Stream';
import {MapOperator} from './MapOperator';

export class Inner<T> implements InternalListener<T> {
  constructor(private out: Stream<T>,
              private op: MapFlattenOperator<T>) {
  }

  _n(t: T) {
    this.out._n(t);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.op.curr = null;
    this.op.less();
  }
}

export class MapFlattenOperator<T> implements InternalProducer<T>, InternalListener<T> {
  public curr: Stream<T> = null; // Current inner Stream
  private inner: InternalListener<T> = null; // Current inner InternalListener
  private open: boolean = true;
  private out: Stream<T> = null;

  constructor(public mapOp: MapOperator<T, Stream<T>>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.mapOp.ins._add(this);
  }

  _stop(): void {
    this.mapOp.ins._remove(this);
    this.curr = null;
    this.inner = null;
    this.open = true;
    this.out = null;
  }

  cut(): void {
    const {curr, inner} = this;
    if (curr && inner) {
      curr._remove(inner);
    }
  }

  less(): void {
    if (!this.open && !this.curr) {
      this.out._c();
    }
  }

  _n(v: T) {
    this.cut();
    try {
      (this.curr = this.mapOp.project(v))._add(this.inner = new Inner(this.out, this));
    } catch (e) {
      this.out._e(e);
    }
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.open = false;
    this.less();
  }
}
