import {Listener} from '../Listener';
import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {emptyListener} from '../utils/emptyListener';

export class Proxy<T, R> implements Listener<T> {
  constructor(public out: Stream<R>,
              public p: MapOperator<T, R>) {
  }

  next(t: T) {
    this.out.next(this.p.project(t));
  }

  error(err: any) {
    this.out.error(err);
  }

  end() {
    this.out.end();
  }
}

export class MapOperator<T, R> implements Operator<T, R> {
  public proxy: Listener<T> = emptyListener;

  constructor(public project: (t: T) => R,
              public ins: Stream<T>) {
  }

  start(out: Stream<R>): void {
    this.ins.addListener(this.proxy = new Proxy(out, this));
  }

  stop(): void {
    this.ins.removeListener(this.proxy);
  }
}
