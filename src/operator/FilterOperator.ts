import {Observer} from '../Observer';
import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class Proxy<T> implements Observer<T> {
  constructor(public out: Stream<T>,
              public p: FilterOperator<T>) {
  }

  next(t: T) {
    if (this.p.predicate(t)) this.out.next(t);
  }

  error(err: any) {
    this.out.error(err);
  }

  end() {
    this.out.end();
  }
}

export class FilterOperator<T> implements Operator<T, T> {
  public proxy: Observer<T> = emptyObserver;

  constructor(public predicate: (t: T) => boolean,
              public ins: Stream<T>) {
  }

  start(out: Stream<T>): void {
    this.ins.subscribe(this.proxy = new Proxy(out, this));
  }

  stop(): void {
    this.ins.unsubscribe(this.proxy);
  }
}
