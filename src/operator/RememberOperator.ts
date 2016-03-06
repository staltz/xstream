import {Observer} from '../Observer';
import {Operator} from '../Operator';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class Proxy<T> implements Observer<T> {
  constructor(public out: Stream<T>,
              public p: RememberOperator<T>) {
  }

  next(t: T) {
    this.out.next(t);
    this.out._val = t;
  }

  error(err: any) {
    this.out.error(err);
  }

  end() {
    this.out.end();
  }
}

export class RememberOperator<T> implements Operator<T, T> {
  public proxy: Observer<T> = emptyObserver;
  public value: any;

  constructor(public ins: Stream<T>) {
  }

  start(out: Stream<T>): void {
    this.ins.subscribe(this.proxy = new Proxy(out, this));
  }

  stop(): void {
    this.ins.unsubscribe(this.proxy);
  }
}
