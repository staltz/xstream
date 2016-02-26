import {Observer} from '../Observer';
import {Machine} from '../Machine';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class TakeMachine<T> implements Machine<T> {
  public proxy: Observer<T> = emptyObserver;
  public taken: number = 0;

  constructor(public max: number,
              public ins: Stream<T>) {
  }

  start(out: Stream<T>): void {
    this.proxy = {
      next: (t: T) => {
        if (this.taken++ < this.max) {
          out.next(t);
        } else {
          out.complete();
          this.stop();
        }
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
