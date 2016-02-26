import {Observer} from '../Observer';
import {Machine} from '../Machine';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class LastMachine<T> implements Machine<T> {
  public proxy: Observer<T> = emptyObserver;
  public has: boolean = false;
  public val: T;

  constructor(public inStream: Stream<T>) {
  }

  start(outStream: Stream<T>): void {
    this.proxy = {
      next: (t: T) => {
        this.has = true;
        this.val = t;
      },
      error: (err) => outStream.error(err),
      complete: () => {
        if (this.has) {
          outStream.next(this.val);
          outStream.complete();
        } else {
          outStream.error('TODO show error about empty stream has no last value');
        }
      },
    };
    this.inStream.subscribe(this.proxy);
  }

  stop(): void {
    this.inStream.unsubscribe(this.proxy);
  }
}
