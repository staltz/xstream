import {Observer} from './Observer';
import {Producer} from './Producer';
import {MapOperator} from './operator/MapOperator';
import {FilterOperator} from './operator/FilterOperator';
import {TakeOperator} from './operator/TakeOperator';
import {SkipOperator} from './operator/SkipOperator';
import {DebugOperator} from './operator/DebugOperator';
import {FoldOperator} from './operator/FoldOperator';
import {LastOperator} from './operator/LastOperator';
import {RememberOperator} from './operator/RememberOperator';
import {StartWithOperator} from './operator/StartWithOperator';
import {
  CombineProducer,
  CombineInstanceSignature,
  CombineFactorySignature,
  CombineProjectFunction} from './factory/CombineProducer';
import {EventProducer} from './factory/EventProducer';
import {FromProducer} from './factory/FromProducer';
import {IntervalProducer} from './factory/IntervalProducer';
import {MergeProducer} from './factory/MergeProducer';
import {empty} from './utils/empty';
import {noop} from './utils/noop';

export class Stream<T> implements Observer<T> {
  public _observers: Array<Observer<T>>;
  public _stopID: any = empty;
  public _prod: Producer<T>;

  constructor(producer: Producer<T>) {
    this._prod = producer;
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
    this._stopID = setTimeout(() => this._prod.stop());
    this._observers = [];
  }

  subscribe(observer: Observer<T>): void {
    this._observers.push(observer);
    if (this._observers.length === 1) {
      if (this._stopID !== empty) {
        clearTimeout(this._stopID);
        this._stopID = empty;
      }
      this._prod.start(this);
    }
  }

  unsubscribe(observer: Observer<T>): void {
    const i = this._observers.indexOf(observer);
    if (i > -1) {
      this._observers.splice(i, 1);
      if (this._observers.length <= 0) {
        this._stopID = setTimeout(() => this._prod.stop());
      }
    }
  }

  static combine: CombineFactorySignature =
    function combine<R>(project: CombineProjectFunction,
                        ...streams: Array<Stream<any>>): Stream<R> {
      return new Stream<R>(new CombineProducer<R>(project, streams));
    };

  static MemoryStream<T>(): MemoryStream<T> {
    return new MemoryStream<T>({start: noop, stop: noop});
  }

  static from<T>(array: Array<T>): Stream<T> {
    return new Stream<T>(new FromProducer(array));
  }

  static merge<T>(...streams: Array<Stream<T>>): Stream<T> {
    return new Stream<T>(new MergeProducer(streams));
  }

  static interval(period: number): Stream<number> {
    return new Stream<number>(new IntervalProducer(period));
  }

  static domEvent(node: EventTarget,
                  eventType: string,
                  useCapture: boolean = false): Stream<Event> {
    return new Stream<Event>(new EventProducer(node, eventType, useCapture));
  }

  map<U>(project: (t: T) => U): Stream<U> {
    return new Stream<U>(new MapOperator(project, this));
  }

  filter(predicate: (t: T) => boolean): Stream<T> {
    return new Stream<T>(new FilterOperator(predicate, this));
  }

  take(amount: number): Stream<T> {
    return new Stream<T>(new TakeOperator(amount, this));
  }

  skip(amount: number): Stream<T> {
    return new Stream<T>(new SkipOperator(amount, this));
  }

  debug(spy: (t: T) => void = null): Stream<T> {
    return new Stream<T>(new DebugOperator(spy, this));
  }

  fold<R>(accumulate: (acc: R, t: T) => R, init: R): Stream<R> {
    return new Stream<R>(new FoldOperator(accumulate, init, this));
  }

  last(): Stream<T> {
    return new Stream<T>(new LastOperator(this));
  }

  remember(): Stream<T> {
    return new MemoryStream<T>(new RememberOperator(this));
  }

  startWith(x: T): Stream<T> {
    return new Stream<T>(new StartWithOperator(this, x));
  }

  merge(other: Stream<T>): Stream<T> {
    return Stream.merge(this, other);
  }

  combine: CombineInstanceSignature<T> =
    function combine<R>(project: CombineProjectFunction,
                        ...streams: Array<Stream<any>>): Stream<R> {
      streams.unshift(this);
      return Stream.combine(project, ...streams);
    };
}

export class MemoryStream<T> extends Stream<T> implements Observer<T> {
  public _val: any;
  constructor(producer: Producer<T>) {
    super(producer);
  }

  next(x: T) {
    this._val = x;
    super.next(x);
  }

  subscribe(observer: Observer<T>): void {
    super.subscribe(observer);
    if (this._val) { observer.next(this._val); }
  }
}
