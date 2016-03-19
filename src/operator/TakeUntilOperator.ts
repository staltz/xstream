import {Stream} from '../Stream';
import {Observer} from '../Observer';
import {Operator} from '../Operator';
import {emptyObserver} from '../utils/emptyObserver';
import {noop} from '../utils/noop';

export class TakeUntilOperator<T> implements Operator<T, T> {
  public out: Observer<T> = emptyObserver;
  public endObserver: Observer<any> = emptyObserver;
  constructor(public ins: Stream<T>, public endStream: Stream<T>) {
  }

  start(out: Observer<T>): void {
    this.out = out;
    function next() { out.end(); }
    this.endStream.take(1).subscribe({next, error: noop, end: noop});
    this.ins.subscribe(this.out);
  }

  stop(): void {
    this.ins.unsubscribe(this.out);
  }
}
