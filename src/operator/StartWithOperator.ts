import {Stream} from '../Stream';
import {Listener} from '../Listener';
import {Operator} from '../Operator';
import {emptyListener} from '../utils/emptyListener';

export class StartWithOperator<T> implements Operator<T, T> {
  public out: Listener<T> = emptyListener;
  constructor(public ins: Stream<T>, public value: T) {
  }

  start(out: Listener<T>): void {
    this.out = out;
    this.out.next(this.value);
    this.ins.addListener(out);
  }

  stop(): void {
    this.ins.removeListener(this.out);
  }
}
