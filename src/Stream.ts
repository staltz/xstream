import {Listener} from './Listener';
import {Producer} from './Producer';
import {InternalListener} from './InternalListener';
import {InternalProducer} from './InternalProducer';
import {MapOperator} from './operator/MapOperator';
import {MapToOperator} from './operator/MapToOperator';
import {FilterOperator} from './operator/FilterOperator';
import {TakeOperator} from './operator/TakeOperator';
import {DropOperator} from './operator/DropOperator';
import {DropRepeatsOperator} from './operator/DropRepeatsOperator';
import {DebugOperator} from './operator/DebugOperator';
import {FoldOperator} from './operator/FoldOperator';
import {LastOperator} from './operator/LastOperator';
import {StartWithOperator} from './operator/StartWithOperator';
import {EndWhenOperator} from './operator/EndWhenOperator';
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
import {internalizeProducer} from './utils/internalizeProducer';

export class Stream<T> implements InternalListener<T> {
  private _ils: Array<InternalListener<T>>; // 'ils' = Internal listeners
  private _stopID: any = empty;
  private _prod: InternalProducer<T>;

  constructor(producer: InternalProducer<T>) {
    this._prod = producer;
    this._ils = [];
  }

  static create<T>(producer?: Producer<T>): Stream<T> {
    if (producer) {
      internalizeProducer(producer); // mutates the input
    }
    return new Stream(<InternalProducer<T>> (<any> producer));
  }

  static createWithMemory<T>(producer?: Producer<T>): MemoryStream<T> {
    if (producer) {
      internalizeProducer(producer); // mutates the input
    }
    return new MemoryStream<T>(<InternalProducer<T>> (<any> producer));
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
    const len = this._ils.length;
    if (len === 1) {
      this._ils[0]._n(t);
    } else {
      for (let i = 0; i < len; i++) {
        this._ils[i]._n(t);
      }
    }
  }

  _e(err: any): void {
    const len = this._ils.length;
    if (len === 1) {
      this._ils[0]._e(err);
    } else {
      for (let i = 0; i < len; i++) {
        this._ils[i]._e(err);
      }
    }
  }

  _c(): void {
    const len = this._ils.length;
    if (len === 1) {
      this._ils[0]._c();
    } else {
      for (let i = 0; i < len; i++) {
        this._ils[i]._c();
      }
    }
    if (this._prod) this._prod._stop();
    this._ils = [];
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

  _add(il: InternalListener<T>): void {
    this._ils.push(il);
    if (this._ils.length === 1) {
      if (this._stopID !== empty) {
        clearTimeout(this._stopID);
        this._stopID = empty;
      }
      if (this._prod) this._prod._start(this);
    }
  }

  _remove(il: InternalListener<T>): void {
    const i = this._ils.indexOf(il);
    if (i > -1) {
      this._ils.splice(i, 1);
      if (this._prod && this._ils.length <= 0) {
        this._stopID = setTimeout(() => this._prod._stop());
      }
    }
  }

  static never(): Stream<void> {
    return new Stream<void>({_start: noop, _stop: noop});
  }

  static empty(): Stream<void> {
    return new Stream<void>({
      _start(il: InternalListener<void>) { il._c(); },
      _stop: noop,
    });
  }

  static throw(err: any): Stream<void> {
    return new Stream<void>({
      _start(il: InternalListener<void>) { il._e(err); },
      _stop: noop,
    });
  }

  static from<T>(array: Array<T>): Stream<T> {
    return new Stream<T>(new FromProducer(array));
  }

  static of<T>(...items: Array<T>): Stream<T> {
    return Stream.from(items);
  }

  static interval(period: number): Stream<number> {
    return new Stream<number>(new IntervalProducer(period));
  }

  static merge<T>(...streams: Array<Stream<T>>): Stream<T> {
    return new Stream<T>(new MergeProducer(streams));
  }

  static combine: CombineFactorySignature =
    function combine<R>(project: CombineProjectFunction,
                        ...streams: Array<Stream<any>>): Stream<R> {
      return new Stream<R>(new CombineProducer<R>(project, streams));
    };

  static domEvent(node: EventTarget,
                  eventType: string,
                  useCapture: boolean = false): Stream<Event> {
    return new Stream<Event>(new EventProducer(node, eventType, useCapture));
  }

  map<U>(project: (t: T) => U): Stream<U> {
    return new Stream<U>(new MapOperator(project, this));
  }

  mapTo<U>(projectedValue: U): Stream<U> {
    return new Stream<U>(new MapToOperator(projectedValue, this));
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

  dropRepeats(isEqual: (x: T, y: T) => boolean = null): Stream<T> {
    return new Stream<T>(new DropRepeatsOperator(isEqual, this));
  }

  last(): Stream<T> {
    return new Stream<T>(new LastOperator(this));
  }

  startWith(x: T): Stream<T> {
    return new Stream<T>(new StartWithOperator(this, x));
  }

  endWhen(other: Stream<any>): Stream<T> {
    return new Stream<T>(new EndWhenOperator(other, this));
  }

  fold<R>(accumulate: (acc: R, t: T) => R, init: R): Stream<R> {
    return new Stream<R>(new FoldOperator(accumulate, init, this));
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

  compose(operator: (stream: Stream<T>) => Stream<any>): Stream<any> {
    return operator(this);
  }

  remember(): Stream<T> {
    return new MemoryStream<T>(this._prod);
  }

  imitate(other: Stream<T>): void {
    other._add(this);
  }

  debug(spy: (t: T) => void = null): Stream<T> {
    return new Stream<T>(new DebugOperator(spy, this));
  }
}

export class MemoryStream<T> extends Stream<T> {
  private _val: any;
  private _has: boolean = false;
  constructor(producer: InternalProducer<T>) {
    super(producer);
  }

  _n(x: T) {
    this._val = x;
    this._has = true;
    super._n(x);
  }

  _add(listener: InternalListener<T>): void {
    if (this._has) { listener._n(this._val); }
    super._add(listener);
  }
}
