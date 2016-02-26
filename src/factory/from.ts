import {Machine} from '../Machine';
import {Observer} from '../Observer';
import {Stream} from '../Stream';
import {noop} from '../utils/noop';

class FromMachine<T> implements Machine<T> {
  constructor(public array: Array<T>) {
  }

  start(out: Observer<T>): void {
    const a = this.array;
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
  const fromMachine = new FromMachine(array);
  return new Stream<T>(fromMachine);
}
