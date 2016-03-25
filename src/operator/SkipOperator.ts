import {Observer} from '../Observer';
import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class Proxy<T> implements Observer<T> {
  constructor(public out: Stream<T>,
              public prod: SkipOperator<T>) {
  }

  next(t: T) {
    if (this.prod.skipped++ >= this.prod.max) this.out.next(t);
  }

  error(err: any) {
    this.out.error(err);
  }

  end() {
    this.out.end();
  }
}

export class SkipOperator<T> implements Operator<T, T> {
  public proxy: Observer<T> = emptyObserver;
  public skipped: number = 0;

  constructor(public max: number,
              public ins: Stream<T>) {
  }

  start(out: Stream<T>): void {
    this.ins.addListener(this.proxy = new Proxy(out, this));
  }

  stop(): void {
    this.ins.removeListener(this.proxy);
  }
}
