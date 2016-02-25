import {Observer} from '../Observer';
import {Machine} from '../Machine';
import {Stream} from '../Stream';

export class SkipMachine<T> implements Machine<T> {
  public proxy: Observer<T>;
  public skipped: number;

  constructor(public max: number,
              public inStream: Stream<T>) {
    this.skipped = 0;
  }

  start(outStream: Stream<T>): void {
    this.proxy = {
      next: (t: T) => {
        if (this.skipped++ >= this.max) outStream.next(t);
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
