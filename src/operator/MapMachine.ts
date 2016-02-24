import {Observer} from '../Observer';
import {Machine} from '../Machine';
import {Stream} from '../Stream';

export class MapMachine<T, U> implements Machine<U> {
  public proxy: Observer<T>;

  constructor(public projection: (t: T) => U,
              public inStream: Stream<T>) {
  }

  start(outStream: Observer<U>): void {
    this.proxy = {
      next: (t: T) => outStream.next(this.projection(t)),
      error: outStream.error,
      complete: outStream.complete,
    };
    this.inStream.subscribe(this.proxy);
  }

  stop(): void {
    this.inStream.unsubscribe(this.proxy);
  }
}
