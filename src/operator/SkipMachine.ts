import {Observer} from '../Observer';
import {Machine} from '../Machine';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class SkipMachine<T> implements Machine<T> {
  public proxy: Observer<T> = emptyObserver;
  public skipped: number = 0;

  constructor(public max: number,
              public ins: Stream<T>) {
  }

  start(out: Stream<T>): void {
    this.proxy = {
      next: (t: T) => {
        if (this.skipped++ >= this.max) out.next(t);
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
