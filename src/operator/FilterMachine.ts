import {Observer} from '../Observer';
import {Machine} from '../Machine';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class FilterMachine<T> implements Machine<T> {
  public proxy: Observer<T>;

  constructor(public predicate: (t: T) => boolean,
              public inStream: Stream<T>) {
    this.proxy = emptyObserver;
  }

  start(outStream: Stream<T>): void {
    this.proxy = {
      next: (t: T) => {
        if (this.predicate(t)) outStream.next(t);
      },
      error: (err) => outStream.error(err),
      complete: () => outStream.complete(),
    };
    this.inStream.subscribe(this.proxy);
  }

  stop(): void {
    this.inStream.unsubscribe(this.proxy);
  }
}
