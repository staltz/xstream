import {Stream} from '../Stream';
import {InternalProducer} from '../InternalProducer';
import {InternalListener} from '../InternalListener';
import {emptyListener} from '../utils/emptyListener';

export class StartWithOperator<T> implements InternalProducer<T> {
  private out: InternalListener<T> = emptyListener;

  constructor(public ins: Stream<T>,
              public value: T) {
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
