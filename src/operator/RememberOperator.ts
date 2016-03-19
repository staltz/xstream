import {Operator} from '../Operator';
import {Stream, MemoryStream} from '../Stream';

export class RememberOperator<T> implements Operator<T, T> {
  public value: any;

  constructor(public ins: Stream<T>) {
  }

  start(out: MemoryStream<T>): void {
    this.ins.subscribe(out);
  }

  stop(): void {
    this.ins.unsubscribe(this.proxy);
  }
}
