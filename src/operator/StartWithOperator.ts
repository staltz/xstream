import {Stream} from '../Stream';
import {Observer} from '../Observer';
import {Operator} from '../Operator';
import {emptyObserver} from '../utils/emptyObserver';

export class StartWithOperator<T> implements Operator<T, T> {
  public out: Observer<T> = emptyObserver;
  constructor(public ins: Stream<T>, public value: T) {
  }

  start(out: Observer<T>): void {
    this.out = out;
    this.out.next(this.value);
    this.ins.subscribe(out);
  }

  stop(): void {
    this.ins.unsubscribe(this.out);
  }
}
