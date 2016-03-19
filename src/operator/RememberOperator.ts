import {Stream, MemoryStream} from '../Stream';
import {Operator} from '../Operator';
import {Observer} from '../Observer';
import {emptyObserver} from '../utils/emptyObserver';

export class RememberOperator<T> implements Operator<T, T> {
  public out: Observer<T> = emptyObserver;

  constructor(public ins: Stream<T>) {
  }

  start(out: MemoryStream<T>): void {
    this.out = out;
    this.ins.subscribe(out);
  }

  stop(): void {
    this.ins.unsubscribe(this.out);
  }
}
