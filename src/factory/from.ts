import {Producer} from '../Producer';
import {Observer} from '../Observer';
import {Stream} from '../Stream';
import {noop} from '../utils/noop';

class FromProducer<T> implements Producer<T> {
  constructor(public a: Array<T>) {
  }

  start(out: Observer<T>): void {
    const a = this.a;
    for (let i = 0, l = a.length; i < l; i++) {
      out.next(a[i]);
    }
    out.end();
  }

  stop(): void {
    noop();
  }
}

export default function from<T>(array: Array<T>) {
  const fromProducer = new FromProducer(array);
  return new Stream<T>(fromProducer);
}
