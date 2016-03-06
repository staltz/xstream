import {Observer} from '../Observer';
import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class Proxy<T, R> implements Observer<T> {
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
  public proxy: Observer<T> = emptyObserver;

  constructor(public project: (t: T) => R,
              public ins: Stream<T>) {
  }

  start(out: Stream<R>): void {
    this.ins.subscribe(this.proxy = new Proxy(out, this));
  }

  stop(): void {
    this.ins.unsubscribe(this.proxy);
  }
}
