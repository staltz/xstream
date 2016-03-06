import {Producer} from '../Producer';
import {Observer} from '../Observer';
import {Stream} from '../Stream';
import {emptyObserver} from '../utils/emptyObserver';

export class MergeProducer<T> implements Producer<T> {
  public out: Observer<T> = emptyObserver;

  constructor(public streams: Array<Stream<T>>) {
  }

  start(out: Observer<T>): void {
    this.out = out;
    for (let i = this.streams.length - 1; i >= 0; i--) {
      this.streams[i].subscribe(out);
    }
  }

  stop(): void {
    for (let i = this.streams.length - 1; i >= 0; i--) {
      this.streams[i].unsubscribe(this.out);
    }
  }
}
