import {InternalListener} from '../InternalListener';
import {Operator} from '../Operator';
import {Stream} from '../Stream';

export class Inner<T> implements InternalListener<T> {
  constructor(private out: Stream<T>,
              private op: FlattenOperator<T>) {
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

export class FlattenOperator<T> implements Operator<Stream<T>, T> {
  public curr: Stream<T> = null; // Current inner Stream
  private inner: InternalListener<T> = null; // Current inner InternalListener
  private open: boolean = true;
  private out: Stream<T> = null;

  constructor(public ins: Stream<Stream<T>>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
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

  _n(s: Stream<T>) {
    this.cut();
    (this.curr = s)._add(this.inner = new Inner(this.out, this));
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.open = false;
    this.less();
  }
}
