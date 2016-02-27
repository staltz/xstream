import {Observer} from '../Observer';
import {Producer} from '../Producer';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class TakeProducer<T> implements Producer<T> {
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
          out.end();
          this.stop();
        }
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
