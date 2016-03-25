import {Listener} from '../Listener';
import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {emptyListener} from '../utils/emptyListener';

export class Proxy<T> implements Listener<T> {
  constructor(public out: Stream<T>,
              public p: DebugOperator<T>) {
  }

  next(t: T) {
    if (this.p.spy) {
      this.p.spy(t);
    } else {
      console.log(t);
    }
    this.out.next(t);
  }

  error(err: any) {
    this.out.error(err);
  }

  end() {
    this.out.end();
  }
}

export class DebugOperator<T> implements Operator<T, T> {
  public proxy: Listener<T> = emptyListener;

  constructor(public spy: (t: T) => void = null,
              public ins: Stream<T>) {
  }

  start(out: Stream<T>): void {
    this.ins.addListener(this.proxy = new Proxy(out, this));
  }

  stop(): void {
    this.ins.removeListener(this.proxy);
  }
}
