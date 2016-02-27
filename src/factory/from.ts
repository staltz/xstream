import {Producer} from '../Producer';
import {Observer} from '../Observer';
import {Stream} from '../Stream';
import {noop} from '../utils/noop';

class FromProducer<T> implements Producer<T> {
  constructor(public a: Array<T>) {
  }

  start(out: Observer<T>): void {
    const a = this.a;
    const L = a.length;
    for (let i = 0; i < L; i++) {
      out.next(a[i]);
    }
    out.complete();
  }

  stop(): void {
    noop();
  }
}

export default function from<T>(array: Array<T>) {
  const fromProducer = new FromProducer(array);
  return new Stream<T>(fromProducer);
}
