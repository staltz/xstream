import {Listener} from './Listener';
import {Producer} from './Producer';
import {MapOperator} from './operator/MapOperator';
import {FilterOperator} from './operator/FilterOperator';
import {TakeOperator} from './operator/TakeOperator';
import {SkipOperator} from './operator/SkipOperator';
import {DebugOperator} from './operator/DebugOperator';
import {FoldOperator} from './operator/FoldOperator';
import {LastOperator} from './operator/LastOperator';
import {StartWithOperator} from './operator/StartWithOperator';
import {FlattenOperator} from './operator/FlattenOperator';
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

export class Stream<T> implements Listener<T> {
  public _listeners: Array<Listener<T>>;
  public _stopID: any = empty;
  public _prod: Producer<T>;

  constructor(producer: Producer<T>) {
    this._prod = producer;
    this._listeners = [];
  }

  next(x: T): void {
    const len = this._listeners.length;
    if (len === 1) {
      this._listeners[0].next(x);
    } else {
      for (let i = 0; i < len; i++) {
        this._listeners[i].next(x);
      }
    }
  }

  error(err: any): void {
    const len = this._listeners.length;
    if (len === 1) {
      this._listeners[0].error(err);
    } else {
      for (let i = 0; i < len; i++) {
        this._listeners[i].error(err);
      }
    }
  }

  end(): void {
    const len = this._listeners.length;
    if (len === 1) {
      this._listeners[0].end();
    } else {
      for (let i = 0; i < len; i++) {
        this._listeners[i].end();
      }
    }
    this._stopID = setTimeout(() => this._prod.stop());
    this._listeners = [];
  }

  addListener(listener: Listener<T>): void {
    this._listeners.push(listener);
    if (this._listeners.length === 1) {
      if (this._stopID !== empty) {
        clearTimeout(this._stopID);
        this._stopID = empty;
      }
      this._prod.start(this);
    }
  }

  removeListener(listener: Listener<T>): void {
    const i = this._listeners.indexOf(listener);
    if (i > -1) {
      this._listeners.splice(i, 1);
      if (this._listeners.length <= 0) {
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

  static of<T>(...items: Array<T>): Stream<T> {
    return Stream.from(items);
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

  static never(): Stream<void> {
    return new Stream<void>({start: noop, stop: noop});
  }

  static empty(): Stream<void> {
    return new Stream<void>({
      start(obs: Listener<void>) { obs.end(); },
      stop: noop,
    });
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
    return new MemoryStream<T>(this._prod);
  }

  startWith(x: T): Stream<T> {
    return new Stream<T>(new StartWithOperator(this, x));
  }

  flatten<R, T extends Stream<R>>(): T {
    return <T> new Stream<R>(new FlattenOperator(<Stream<Stream<R>>> (<any> this)));
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

export class MemoryStream<T> extends Stream<T> {
  public _val: any;
  constructor(producer: Producer<T>) {
    super(producer);
  }

  next(x: T) {
    this._val = x;
    super.next(x);
  }

  addListener(listener: Listener<T>): void {
    super.addListener(listener);
    if (this._val) { listener.next(this._val); }
  }
}
