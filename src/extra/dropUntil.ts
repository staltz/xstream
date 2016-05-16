import {Operator, InternalListener, Stream, emptyListener} from '../core';

class OtherIL<T> implements InternalListener<any> {
  constructor(private out: Stream<T>,
              private op: DropUntilOperator<T>) {
  }

  _n(t: T) {
    this.op.up();
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.op.up();
  }
}

export class DropUntilOperator<T> implements Operator<T, T> {
  public type = 'dropUntil';
  private out: Stream<T> = null;
  private oil: InternalListener<any> = emptyListener; // oil = other InternalListener
  private on: boolean = false;

  constructor(public o: Stream<any>, // o = other
              public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.o._add(this.oil = new OtherIL(out, this));
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.o._remove(this.oil);
    this.out = null;
    this.oil = null;
  }

  up(): void {
    this.on = true;
    this.o._remove(this.oil);
    this.oil = null;
  }

  _n(t: T) {
    const u = this.out;
    if (!u) return;
    if (!this.on) return;
    u._n(t);
  }

  _e(err: any) {
    const u = this.out;
    if (!u) return;
    u._e(err);
  }

  _c() {
    const u = this.out;
    if (!u) return;
    this.up();
    u._c();
  }
}

export default function dropUntil<T>(other: Stream<any>): (ins: Stream<T>) => Stream<T> {
  return function dropUntilOperator(ins: Stream<T>): Stream<T> {
    return new Stream<T>(new DropUntilOperator(other, ins));
  };
}
