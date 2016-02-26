import {Observer} from '../Observer';
import {Machine} from '../Machine';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class MapMachine<T, U> implements Machine<U> {
  public proxy: Observer<T> = emptyObserver;

  constructor(public project: (t: T) => U,
              public ins: Stream<T>) {
  }

  start(out: Stream<U>): void {
    this.proxy = {
      next: (t: T) => out.next(this.project(t)),
      error: (err) => out.error(err),
      complete: () => out.complete(),
    };
    this.ins.subscribe(this.proxy);
  }

  stop(): void {
    this.ins.unsubscribe(this.proxy);
  }
}
