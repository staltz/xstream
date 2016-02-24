import {Observer} from '../Observer';
import {Machine} from '../Machine';
import {Stream} from '../Stream';

export class FilterMachine<T> implements Machine<T> {
  public proxy: Observer<T>;

  constructor(public predicate: (t: T) => boolean,
              public inStream: Stream<T>) {
  }

  start(outStream: Observer<T>): void {
    this.proxy = {
      next: (t: T) => {
        if (this.predicate(t)) outStream.next(t);
      },
      error: outStream.error,
      complete: outStream.complete,
    };
    this.inStream.subscribe(this.proxy);
  }

  stop(): void {
    this.inStream.unsubscribe(this.proxy);
  }
}
