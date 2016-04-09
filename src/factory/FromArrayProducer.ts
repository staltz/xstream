import {InternalProducer} from '../InternalProducer';
import {InternalListener} from '../InternalListener';

export class FromArrayProducer<T> implements InternalProducer<T> {
  constructor(public a: Array<T>) {
  }

  _start(out: InternalListener<T>): void {
    const a = this.a;
    for (let i = 0, l = a.length; i < l; i++) {
      out._n(a[i]);
    }
    out._c();
  }

  _stop(): void {
  }
}
