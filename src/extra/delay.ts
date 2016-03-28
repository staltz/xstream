import {Stream} from '../Stream';
import {InternalListener} from '../InternalListener';
import {Operator} from '../Operator';
import {emptyListener} from '../utils/emptyListener';

class Proxy<T> implements InternalListener<T> {
  constructor(private out: Stream<T>,
              private op: DelayOperator<T>) {
  }

  _n(t: T) {
    const self = this;
    const id = setInterval(() => {
      self.out._n(t);
      clearInterval(id);
    }, this.op.period);
  }

  _e(err: any) {
    const self = this;
    const id = setInterval(() => {
      self.out._e(err);
      clearInterval(id);
    }, this.op.period);
  }

  _c() {
    const self = this;
    const id = setInterval(() => {
      self.out._c();
      clearInterval(id);
    }, this.op.period);
  }
}

class DelayOperator<T> implements Operator<T, T> {
  private proxy: InternalListener<T> = emptyListener;

  constructor(public period: number,
              public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.ins._add(this.proxy = new Proxy(out, this));
  }

  _stop(): void {
    this.ins._remove(this.proxy);
  }
}

export default function delay<T>(period: number): (ins: Stream<T>) => Stream<T> {
  return function delayOperator(ins: Stream<T>) {
    return new Stream<T>(new DelayOperator(period, ins));
  };
}
