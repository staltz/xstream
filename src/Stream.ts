import {Listener} from './Listener';
import {Producer} from './Producer';
import {InternalListener} from './InternalListener';
import {InternalProducer} from './InternalProducer';
import {MapOperator} from './operator/MapOperator';
import {FilterOperator} from './operator/FilterOperator';
import {TakeOperator} from './operator/TakeOperator';
import {DropOperator} from './operator/DropOperator';
import {DebugOperator} from './operator/DebugOperator';
import {FoldOperator} from './operator/FoldOperator';
import {LastOperator} from './operator/LastOperator';
import {StartWithOperator} from './operator/StartWithOperator';
import {FlattenOperator} from './operator/FlattenOperator';
import {FlattenConcurrentlyOperator} from './operator/FlattenConcurrentlyOperator';
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

export class Stream<T> implements InternalListener<T> {
  public _listeners: Array<InternalListener<T>>;
  public _stopID: any = empty;
  public _prod: InternalProducer<T>;

  constructor(producer: InternalProducer<T>) {
    this._prod = producer;
    this._listeners = [];
  }

  static create<T>(producer: Producer<T>): Stream<T> {
    (<InternalProducer<T>> (<any> producer))._start =
      function _start(il: InternalListener<T>) {
        (<Listener<T>> (<any> il)).next = il._n;
        (<Listener<T>> (<any> il)).error = il._e;
        (<Listener<T>> (<any> il)).complete = il._c;
        producer.start(<Listener<T>> (<any> il));
      };
    (<InternalProducer<T>> (<any> producer))._stop = producer.stop;
    return new Stream(<InternalProducer<T>> (<any> producer));
  }

  shamefullySendNext(value: T) {
    this._n(value);
  }

  shamefullySendError(error: any) {
    this._e(error);
  }

  shamefullySendComplete() {
    this._c();
  }

  _n(t: T): void {
    const len = this._listeners.length;
    if (len === 1) {
      this._listeners[0]._n(t);
    } else {
      for (let i = 0; i < len; i++) {
        this._listeners[i]._n(t);
      }
    }
  }

  _e(err: any): void {
    const len = this._listeners.length;
    if (len === 1) {
      this._listeners[0]._e(err);
    } else {
      for (let i = 0; i < len; i++) {
        this._listeners[i]._e(err);
      }
    }
  }

  _c(): void {
    const len = this._listeners.length;
    if (len === 1) {
      this._listeners[0]._c();
    } else {
      for (let i = 0; i < len; i++) {
        this._listeners[i]._c();
      }
    }
    this._stopID = setTimeout(() => this._prod._stop());
    this._listeners = [];
  }

  addListener(listener: Listener<T>): void {
    (<InternalListener<T>> (<any> listener))._n = listener.next;
    (<InternalListener<T>> (<any> listener))._e = listener.error;
    (<InternalListener<T>> (<any> listener))._c = listener.complete;
    this._add(<InternalListener<T>> (<any> listener));
  }

  removeListener(listener: Listener<T>): void {
    this._remove(<InternalListener<T>> (<any> listener));
  }

  _add(listener: InternalListener<T>): void {
    this._listeners.push(listener);
    if (this._listeners.length === 1) {
      if (this._stopID !== empty) {
        clearTimeout(this._stopID);
        this._stopID = empty;
      }
      this._prod._start(this);
    }
  }

  _remove(listener: InternalListener<T>): void {
    const i = this._listeners.indexOf(listener);
    if (i > -1) {
      this._listeners.splice(i, 1);
      if (this._listeners.length <= 0) {
        this._stopID = setTimeout(() => this._prod._stop());
      }
    }
  }

  static combine: CombineFactorySignature =
    function combine<R>(project: CombineProjectFunction,
                        ...streams: Array<Stream<any>>): Stream<R> {
      return new Stream<R>(new CombineProducer<R>(project, streams));
    };

  static MemoryStream<T>(): MemoryStream<T> {
    return new MemoryStream<T>({_start: noop, _stop: noop});
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
    return new Stream<void>({_start: noop, _stop: noop});
  }

  static empty(): Stream<void> {
    return new Stream<void>({
      _start(lner: InternalListener<void>) { lner._c(); },
      _stop: noop,
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

  drop(amount: number): Stream<T> {
    return new Stream<T>(new DropOperator(amount, this));
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

  flattenConcurrently<R, T extends Stream<R>>(): T {
    return <T> new Stream<R>(new FlattenConcurrentlyOperator(<Stream<Stream<R>>> (<any> this)));
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
  constructor(producer: InternalProducer<T>) {
    super(producer);
  }

  _n(x: T) {
    this._val = x;
    super._n(x);
  }

  _add(listener: InternalListener<T>): void {
    super._add(listener);
    if (this._val) { listener._n(this._val); }
  }
}
