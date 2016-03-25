import {Listener} from '../Listener';
import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {emptyListener} from '../utils/emptyListener';

export class Proxy<T> implements Listener<T> {
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
  public proxy: Listener<T> = emptyListener;
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
