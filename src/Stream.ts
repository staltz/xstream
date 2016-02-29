import {Observer} from './Observer';
import {Producer} from './Producer';
import {MapProducer} from './operator/MapProducer';
import {FilterProducer} from './operator/FilterProducer';
import {TakeProducer} from './operator/TakeProducer';
import {SkipProducer} from './operator/SkipProducer';
import {DebugProducer} from './operator/DebugProducer';
import {FoldProducer} from './operator/FoldProducer';
import {LastProducer} from './operator/LastProducer';
import {RememberProducer} from './operator/RememberProducer';
import merge from './factory/merge';
import {empty} from './utils/empty';

export class Stream<T> implements Observer<T> {
  public _observers: Array<Observer<T>>;
  public _stopID: any = empty;
  public value: any;

  constructor(public _producer: Producer<T>) {
    this._observers = [];
  }

  next(x: T): void {
    const len = this._observers.length;
    if (len === 1) {
      this._observers[0].next(x);
    } else {
      for (let i = 0; i < len; i++) {
        this._observers[i].next(x);
      }
    }
  }

  error(err: any): void {
    const len = this._observers.length;
    if (len === 1) {
      this._observers[0].error(err);
    } else {
      for (let i = 0; i < len; i++) {
        this._observers[i].error(err);
      }
    }
  }

  end(): void {
    const len = this._observers.length;
    if (len === 1) {
      this._observers[0].end();
    } else {
      for (let i = 0; i < len; i++) {
        this._observers[i].end();
      }
    }
    this._stopID = setTimeout(() => this._producer.stop());
  }

  subscribe(observer: Observer<T>): void {
    this._observers.push(observer);
    if (this._observers.length === 1) {
      if (this._stopID !== empty) {
        clearTimeout(this._stopID);
        this._stopID = empty;
      }
      this._producer.start(this);
    }
    if (this.value) {
      observer.next(this.value);
      if (this._stopID !== empty) {
        observer.end();
      }
    }
  }

  unsubscribe(observer: Observer<T>): void {
    const i = this._observers.indexOf(observer);
    if (i > -1) {
      this._observers.splice(i, 1);
      if (this._observers.length <= 0) {
        this._stopID = setTimeout(() => this._producer.stop());
      }
    }
  }

  map<U>(project: (t: T) => U): Stream<U> {
    return new Stream<U>(new MapProducer(project, this));
  }

  filter(predicate: (t: T) => boolean): Stream<T> {
    return new Stream<T>(new FilterProducer(predicate, this));
  }

  take(amount: number): Stream<T> {
    return new Stream<T>(new TakeProducer(amount, this));
  }

  skip(amount: number): Stream<T> {
    return new Stream<T>(new SkipProducer(amount, this));
  }

  debug(spy: (t: T) => void = null): Stream<T> {
    return new Stream<T>(new DebugProducer(spy, this));
  }

  fold<R>(accumulate: (acc: R, t: T) => R, init: R): Stream<R> {
    return new Stream<R>(new FoldProducer(accumulate, init, this));
  }

  last(): Stream<T> {
    return new Stream<T>(new LastProducer(this));
  }

  remember(): Stream<T> {
    return new Stream<T>(new RememberProducer(this));
  }

  merge(other: Stream<T>): Stream<T> {
    return merge(this, other);
  }
}
