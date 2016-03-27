import {Stream} from '../Stream';
import {InternalListener} from '../InternalListener';
import {Operator} from '../Operator';
import {emptyListener} from '../utils/emptyListener';

export class StartWithOperator<T> implements Operator<T, T> {
  public out: InternalListener<T> = emptyListener;
  constructor(public ins: Stream<T>, public value: T) {
  }

  _start(out: InternalListener<T>): void {
    this.out = out;
    this.out._n(this.value);
    this.ins._add(out);
  }

  _stop(): void {
    this.ins._remove(this.out);
  }
}
