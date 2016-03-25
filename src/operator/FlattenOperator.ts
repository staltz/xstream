import {Listener} from '../Listener';
import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {emptyListener} from '../utils/emptyListener';
import {MapOperator} from './MapOperator';

export class Inner<T> implements Listener<T> {
  constructor(public out: Stream<T>,
              public op: FlattenOperator<T>) {
  }

  next(t: T) {
    this.out.next(t);
  }

  error(err: any) {
    this.out.error(err);
  }

  end() {
    this.op.curr = null;
    this.op.less();
  }
}

export class Outer<T> implements Listener<Stream<T>> {
  constructor(public out: Stream<T>,
              public op: FlattenOperator<T>) {
  }

  next(s: Stream<T>) {
    this.op.cut();
    (this.op.curr = s).addListener(this.op.inner = new Inner(this.out, this.op));
  }

  error(err: any) {
    this.out.error(err);
  }

  end() {
    this.op.open = false;
    this.op.less();
  }
}

export class MapOuter<T> implements Listener<T> {
  constructor(public out: Stream<T>,
              public pr: (t: T) => Stream<T>, // pr = project
              public op: FlattenOperator<T>) {
  }

  next(v: T) {
    this.op.cut();
    (this.op.curr = this.pr(v)).addListener(this.op.inner = new Inner(this.out, this.op));
  }

  error(err: any) {
    this.out.error(err);
  }

  end() {
    this.op.open = false;
    this.op.less();
  }
}

export class FlattenOperator<T> implements Operator<Stream<T>, T> {
  public proxy: Listener<T | Stream<T>> = emptyListener;
  public mapOp: MapOperator<T, Stream<T>>;
  public curr: Stream<T>; // Current inner Stream
  public inner: Listener<T>; // Current inner Listener
  public open: boolean = true;
  public out: Stream<T>;

  constructor(public ins: Stream<Stream<T>>) {
    if (ins._prod instanceof MapOperator) {
      this.mapOp = <MapOperator<T, Stream<T>>> ins._prod;
    }
  }

  start(out: Stream<T>): void {
    this.out = out;
    const mapOp = this.mapOp;
    if (mapOp) {
      mapOp.ins.addListener(this.proxy = new MapOuter(out, mapOp.project, this));
    } else {
      this.ins.addListener(this.proxy = new Outer(out, this));
    }
  }

  stop(): void {
    this.ins.removeListener(this.proxy);
  }

  cut(): void {
    const {curr, inner} = this;
    if (curr && inner) {
      curr.removeListener(inner);
    }
  }

  less(): void {
    if (!this.open && !this.curr) {
      this.out.end();
    }
  }
}
