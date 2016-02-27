import {Observer} from '../Observer';
import {Producer} from '../Producer';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class DebugProducer<T> implements Producer<T> {
  public proxy: Observer<T> = emptyObserver;

  constructor(public spy: (t: T) => void = null,
              public ins: Stream<T>) {
  }

  start(out: Stream<T>): void {
    this.proxy = {
      next: (t: T) => {
        if (this.spy) {
          this.spy(t);
        } else {
          console.log(t);
        }
        out.next(t);
      },
      error: (err) => out.error(err),
      end: () => out.end(),
    };
    this.ins.subscribe(this.proxy);
  }

  stop(): void {
    this.ins.unsubscribe(this.proxy);
  }
}
