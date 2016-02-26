import {Observer} from '../Observer';
import {Machine} from '../Machine';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class MapMachine<T, U> implements Machine<U> {
  public proxy: Observer<T>;

  constructor(public projection: (t: T) => U,
              public inStream: Stream<T>) {
    this.proxy = emptyObserver;
  }

  start(outStream: Stream<U>): void {
    this.proxy = {
      next: (t: T) => outStream.next(this.projection(t)),
      error: (err) => outStream.error(err),
      complete: () => outStream.complete(),
    };
    this.inStream.subscribe(this.proxy);
  }

  stop(): void {
    this.inStream.unsubscribe(this.proxy);
  }
}
