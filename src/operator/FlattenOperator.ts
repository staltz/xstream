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
    this.op.less();
  }
}

export class Outer<T> implements Observer<Stream<T>> {
  constructor(public out: Stream<T>,
              public op: FlattenOperator<T>) {
  }

  next(s: Stream<T>) {
    s.addListener(new Inner(this.out, this.op));
  }

  error(err: any) {
    this.out.error(err);
  }

  end() {
    this.op.less();
  }
}

export class MapOuter<T> implements Observer<T> {
  constructor(public out: Stream<T>,
              public pr: (t: T) => Stream<T>,
              public op: FlattenOperator<T>) { // pr = project
  }

  next(v: T) {
    this.op.active++;
    this.pr(v).addListener(new Inner(this.out, this.op));
  }

  error(err: any) {
    this.out.error(err);
  }

  end() {
    this.op.less();
  }
}

export class FlattenOperator<T> implements Operator<Stream<T>, T> {
  public proxy: Observer<T | Stream<T>> = emptyObserver;
  public mapOp: MapOperator<T, Stream<T>>;
  public active: number = 1; // number of outers and inners that have not yet ended
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

  less(): void {
    this.active--;
    if (this.active === 0) {
      this.out.end();
    }
  }
}
