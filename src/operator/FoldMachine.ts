import {Observer} from '../Observer';
import {Machine} from '../Machine';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class FoldMachine<T, R> implements Machine<R> {
  public proxy: Observer<T>;
  public acc: R;

  constructor(public accumulator: (acc: R, t: T) => R,
              public initAcc: R,
              public inStream: Stream<T>) {
    this.proxy = emptyObserver;
    this.acc = initAcc;
  }

  start(outStream: Stream<R>): void {
    outStream.next(this.initAcc);
    this.proxy = {
      next: (t: T) => {
        this.acc = this.accumulator(this.acc, t);
        outStream.next(this.acc);
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
