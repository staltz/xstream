import {Observer} from '../Observer';
import {Machine} from '../Machine';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class FilterMachine<T> implements Machine<T> {
  public proxy: Observer<T> = emptyObserver;

  constructor(public predicate: (t: T) => boolean,
              public ins: Stream<T>) {
  }

  start(out: Stream<T>): void {
    this.proxy = {
      next: (t: T) => {
        if (this.predicate(t)) out.next(t);
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
