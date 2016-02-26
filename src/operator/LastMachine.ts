import {Observer} from '../Observer';
import {Machine} from '../Machine';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class LastMachine<T> implements Machine<T> {
  public proxy: Observer<T> = emptyObserver;
  public has: boolean = false;
  public val: T = <T> {};

  constructor(public ins: Stream<T>) {
  }

  start(out: Stream<T>): void {
    this.proxy = {
      next: (t: T) => {
        this.has = true;
        this.val = t;
      },
      error: (err) => out.error(err),
      complete: () => {
        if (this.has) {
          out.next(this.val);
          out.complete();
        } else {
          out.error('TODO show error about empty stream has no last value');
        }
      },
    };
    this.ins.subscribe(this.proxy);
  }

  stop(): void {
    this.ins.unsubscribe(this.proxy);
  }
}
