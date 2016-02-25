import {Observer} from '../Observer';
import {Machine} from '../Machine';
import {Stream} from '../Stream';

export class TakeMachine<T> implements Machine<T> {
  public proxy: Observer<T>;
  public taken: number;

  constructor(public max: number,
              public inStream: Stream<T>) {
    this.taken = 0;
  }

  start(outStream: Stream<T>): void {
    this.proxy = {
      next: (t: T) => {
        if (this.taken++ < this.max) {
          outStream.next(t);
        } else {
          outStream.complete();
          this.stop();
        }
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
