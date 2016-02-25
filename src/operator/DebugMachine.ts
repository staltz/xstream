import {Observer} from '../Observer';
import {Machine} from '../Machine';
import {Stream} from '../Stream';

export class DebugMachine<T> implements Machine<T> {
  public proxy: Observer<T>;

  constructor(public spy: (t: T) => void = null,
              public inStream: Stream<T>) {
  }

  start(outStream: Stream<T>): void {
    this.proxy = {
      next: (t: T) => {
        if (this.spy) {
          this.spy(t);
        } else {
          console.log(t);
        }
        outStream.next(t);
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
