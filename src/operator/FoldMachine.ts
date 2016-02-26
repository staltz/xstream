import {Observer} from '../Observer';
import {Machine} from '../Machine';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class FoldMachine<T, R> implements Machine<R> {
  public proxy: Observer<T> = emptyObserver;
  public acc: R;

  constructor(public accumulator: (acc: R, t: T) => R,
              public seed: R,
              public ins: Stream<T>) {
    this.acc = seed;
  }

  start(out: Stream<R>): void {
    out.next(this.seed);
    this.proxy = {
      next: (t: T) => {
        this.acc = this.accumulator(this.acc, t);
        out.next(this.acc);
      },
      error: (err) => out.error(err),
      complete: () => out.complete(),
    };
    this.ins.subscribe(this.proxy);
  }

  stop(): void {
    this.ins.unsubscribe(this.proxy);
  }
}
