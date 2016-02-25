import {Machine} from '../Machine';
import {Observer} from '../Observer';
import {Stream} from '../Stream';
import {noop} from '../utils/noop';

class FromMachine<T> implements Machine<T> {
  constructor(public array: Array<T>) {
  }

  start(stream: Observer<T>): void {
    const arr = this.array;
    const len = arr.length;
    for (let i = 0; i < len; i++) {
      stream.next(arr[i]);
    }
    stream.complete();
  }

  stop(): void {
    noop();
  }
}

export default function from<T>(array: Array<T>) {
  const fromMachine = new FromMachine(array);
  return new Stream<T>(fromMachine);
}
