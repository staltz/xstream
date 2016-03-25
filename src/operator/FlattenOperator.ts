import {Observer} from '../Observer';
import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';
import {MapOperator} from './MapOperator';

export class Inner<T> implements Observer<T> {
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

export class Outer<T> implements Observer<Stream<T>> {
  constructor(public out: Stream<T>,
              public op: FlattenOperator<T>) {
  }

  next(s: Stream<T>) {
    this.op.cut();
    (this.op.curr = s).subscribe(this.op.inner = new Inner(this.out, this.op));
  }

  error(err: any) {
    this.out.error(err);
  }

  end() {
    this.op.open = false;
    this.op.less();
  }
}

export class MapOuter<T> implements Observer<T> {
  constructor(public out: Stream<T>,
              public pr: (t: T) => Stream<T>, // pr = project
              public op: FlattenOperator<T>) {
  }

  next(v: T) {
    this.op.cut();
    (this.op.curr = this.pr(v)).subscribe(this.op.inner = new Inner(this.out, this.op));
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
  public proxy: Observer<T | Stream<T>> = emptyObserver;
  public mapOp: MapOperator<T, Stream<T>>;
  public curr: Stream<T>; // Current inner Stream
  public inner: Observer<T>; // Current inner Observer
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
      mapOp.ins.subscribe(this.proxy = new MapOuter(out, mapOp.project, this));
    } else {
      this.ins.subscribe(this.proxy = new Outer(out, this));
    }
  }

  stop(): void {
    this.ins.unsubscribe(this.proxy);
  }

  cut(): void {
    const {curr, inner} = this;
    if (curr && inner) {
      curr.unsubscribe(inner);
    }
  }

  less(): void {
    if (!this.open && !this.curr) {
      this.out.end();
    }
  }
}
