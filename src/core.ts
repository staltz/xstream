import { Promise } from 'es6-promise'
import $$observable from 'symbol-observable'

import { Subscribable, Subscription, Listener } from './interfaces'
import { append, remove, findIndex, copy, forEach } from './util'

import { MapOperator } from './operator/map'
import { FilterOperator, Predicate } from './operator/filter'
import { TakeOperator } from './operator/take'
import { DropOperator } from './operator/drop'
import { LastOperator } from './operator/last'
import { StartWithOperator } from './operator/startWith'
import { EndWhenOperator } from './operator/endWhen'
import { FoldOperator, FoldFn } from './operator/fold'
import { ReplaceErrorOperator, ReplaceErrorFn } from './operator/replaceError'
import { FlattenOperator } from './operator/flatten'
import { RememberOperator } from './operator/remember'

const EMPTY = {}
function noop (): void { return void 0 }

class FromPromiseProducer<T> implements Subscribable<T> {
  private on: boolean = false
  constructor (private promise: Promise<T>) {}

  subscribe (listener: Listener<T>) {
    this.on = true
    this.promise.then(
      (x: T) => {
        if (this.on) {
          listener.next(x)
          listener.complete()
        }
      },
      (e: any) => {
        listener.error(e)
      }
    ).then(null, (err: any) => {
      setTimeout(() => { throw err })
    })
    return new StreamSubscription(() => { this.on = false })
  }
}

class PeriodicProducer implements Subscribable<number> {
  constructor (private period: number) {}

  subscribe (listener: Listener<number>) {
    let i: number = -1
    function intervalHandler () { listener.next(i++) }
    let intervalID: number = -1
    intervalID = (<number> <any> setInterval(intervalHandler, this.period))

    return new StreamSubscription(() => {
      if (intervalID !== -1) clearInterval(intervalID)
      intervalID = -1
      i = -1
    })
  }
}

class MergeProducer<T> implements Subscribable<T> {
  constructor (private streamsArray: Stream<T>[]) {}

  subscribe (listener: Listener<T>) {
    const sa = this.streamsArray
    const mergeListener = new MergeListener<T>(listener, sa.length)
    const subscriptions: Subscription[] = sa.map((s: Stream<T>) => s.subscribe(mergeListener))

    return new CompositeSubscription(subscriptions)
  }
}

class MergeListener<T> implements Listener<T> {
  constructor (private listener: Listener<T>, private ac: number) {}

  next (x: T) {
    this.listener.next(x)
  }

  error (e: any) {
    this.listener.error(e)
  }

  complete () {
    if (--this.ac <= 0) {
      this.listener.complete()
    }
  }
}

export interface CombineSignature {
  (): Stream<Array<any>>;
  <T1>(s1: Stream<T1>): Stream<[T1]>;
  <T1, T2>(
    s1: Stream<T1>,
    s2: Stream<T2>): Stream<[T1, T2]>;
  <T1, T2, T3>(
    s1: Stream<T1>,
    s2: Stream<T2>,
    s3: Stream<T3>): Stream<[T1, T2, T3]>;
  <T1, T2, T3, T4>(
    s1: Stream<T1>,
    s2: Stream<T2>,
    s3: Stream<T3>,
    s4: Stream<T4>): Stream<[T1, T2, T3, T4]>;
  <T1, T2, T3, T4, T5>(
    s1: Stream<T1>,
    s2: Stream<T2>,
    s3: Stream<T3>,
    s4: Stream<T4>,
    s5: Stream<T5>): Stream<[T1, T2, T3, T4, T5]>;
  <T1, T2, T3, T4, T5, T6>(
    s1: Stream<T1>,
    s2: Stream<T2>,
    s3: Stream<T3>,
    s4: Stream<T4>,
    s5: Stream<T5>,
    s6: Stream<T6>): Stream<[T1, T2, T3, T4, T5, T6]>;
  (...stream: Array<Stream<any>>): Stream<Array<any>>;
}

class CombineProducer<R> implements Subscribable<R[]> {
  constructor (private streams: Stream<any>[]) {}

  subscribe (listener: Listener<R[]>) {
    const streams = this.streams
    const l = streams.length

    const combineListener = new CombineListener(l, listener)

    const subscriptions: Subscription[] = streams.map((s: Stream<any>, i: number) => {
      return s.subscribe(new IndexListener(i, combineListener))
    })

    return new CompositeSubscription(subscriptions)
  }
}

class CombineListener<T> {
  private completed: boolean[]
  private active: boolean[]
  private values: T[]
  constructor (l: number, private listener: Listener<T[]>) {
    this.completed = new Array(l).map(() => false)
    this.active = new Array(l).map(() => false)
    this.values = new Array(l)
  }

  next (x: [number, T]) {
    const [index, value] = x
    this.active[index] = true
    this.values[index] = value
    if (this.isReady()) {
      this.listener.next(this.values)
    }
  }

  error (e: any) {
    this.listener.error(e)
  }

  complete (x: number) {
    this.completed[x] = true
    if (this.isComplete()) {
      this.listener.complete()
    }
  }

  private isReady (): boolean {
    return this.active.every(Boolean)
  }

  private isComplete (): boolean {
    return this.completed.every(Boolean)
  }

}

class IndexListener<T> implements Listener<T> {
  constructor (private i: number, private listener: CombineListener<T>) {}

  next (x: T) {
    this.listener.next([this.i, x]);
  }

  error (e: any) {
    this.listener.error([this.i, e])
  }

  complete () {
    this.listener.complete(this.i)
  }
}

// TODO: add this.type info for operators where possible
// TODO: add back fusion opportunities
// TODO: MemoryStream methods continue returning MemoryStreams
export class Stream<T> implements Subscribable<T> {
  _subscribable: Subscribable<T>
  _listeners: Listener<T>[] = []
  protected _stopId: Object | number = EMPTY
  protected _subscription: Subscription = (EMPTY as Subscription)
  protected _target: Stream<T> = (EMPTY as Stream<T>)
  protected _err: any
  constructor (subscribable: Subscribable<T>) {
    this._subscribable = subscribable || (EMPTY as Subscribable<T>)
  }

  static create<T> (subscribable?: Subscribable<T>): Stream<T> {
    return new Stream<T>(subscribable)
  }

  static never (): Stream<any> {
    return new Stream<any>({
      subscribe: () => new StreamSubscription(noop)
    })
  }

  static empty (): Stream<any> {
    return new Stream<any>({
      subscribe (listener: Listener<any>) {
        listener.complete()
        return new StreamSubscription(noop)
      }
    })
  }

  static throw (error: any) {
    return new Stream<any>({
      subscribe (listener: Listener<any>) {
        listener.error(error)
        return new StreamSubscription(noop)
      }
    })
  }

  static from<T> (x: ArrayLike<T> | Subscribable<T>) {
    if (x[$$observable]) {
      return new Stream((x[$$observable] as Subscribable<T>))
    } else if (typeof (x as Subscribable<T>).subscribe === 'function') {
      return new Stream((x as Subscribable<T>))
    } else if (typeof (<Promise<T>> <any> x).then === 'function') {
      return Stream.fromPromise((<Promise<T>> <any> x))
    } else if (Array.isArray(x) || (x as ArrayLike<T>).length) {
      return Stream.fromArray((x as ArrayLike<T>))
    } else {
      throw new TypeError('from() only accepts input as an Observable, Promise, or ArrayLike Object')
    }
  }

  static of<T> (...items: T[]): Stream<T> {
    return Stream.fromArray<T>(items)
  }

  static fromArray<T> (array: T[] | ArrayLike<T>): Stream<T> {
    const l = array.length
    return l === 0
      ? Stream.empty()
      : new Stream({ subscribe (listener: Listener<T>) {
        forEach<T>((x: T) => { listener.next(x) }, array)
        listener.complete()
        return new StreamSubscription(noop)
      }})
  }

  static fromPromise<T> (promise: Promise<T>): Stream<T> {
    return new Stream<T>(new FromPromiseProducer<T>(promise))
  }

  static periodic (period: number): Stream<number> {
    return new Stream<number>(new PeriodicProducer(period))
  }

  static merge<T> (...streams: Stream<T>[]): Stream<T> {
    const l = streams.length
    return l === 0 ? Stream.empty()
      : l === 1 ? streams[0]
      : new Stream<T>(new MergeProducer<T>(streams))
  }

 static combine: CombineSignature = <CombineSignature>
    function combine(...streams: Stream<any>[]): Stream<any[]> {
      return new Stream<any[]>(new CombineProducer<any>(streams))
    }

  private ctor (): typeof Stream {
    return this instanceof MemoryStream ? MemoryStream : Stream
  }

  addListener (listener: Listener<T>): void {
    const target = this._target
    if (target !== EMPTY) return target.addListener(listener)

    this._listeners = append<Listener<T>>(listener, this._listeners)
    const length = this._listeners.length
    if (length === 1) {
      if (this._stopId !== EMPTY) {
        clearTimeout(this._stopId as number)
        this._stopId = EMPTY
      }
      const s = this._subscribable
      if (s !== EMPTY) {
        this._subscription = this._subscribable.subscribe(new StreamListener(this))
      }
    }
  }

  removeListener (listener: Listener<T>): void {
    const target = this._target
    if (target !== EMPTY) return (target as Stream<T>).removeListener(listener)

    const index = findIndex<Listener<T>>(listener, this._listeners)
    this._listeners = remove<Listener<T>>(index, this._listeners)
    const length = this._listeners.length

    if (length === 0) {
      this._stopId = setTimeout(() => this._stop());
    } else if (length === 1) {
      this._pruneCycles()
    }
  }

  private _pruneCycles () {
    if (this._hasNoListeners(this, [])) {
      this.removeListener(this._listeners[0])
    }
  }

  private _hasNoListeners (x: Listener<any> | Stream<any> | Subscribable<any>, trace: any[]): boolean {
    if (findIndex(x, trace) !== -1) {
      return true
    } else if ((x as Stream<any>)._subscribable === this) {
      return true
    } else if ((x as Stream<any>)._subscribable && (x as Stream<any>)._subscribable !== EMPTY) {
      return this._hasNoListeners((x as Stream<any>)._subscribable, trace.concat(x))
    } else if ((x as Stream<any>)._listeners) {
      for (let i = 0, N = (x as Stream<any>)._listeners.length; i < N; ++i) {
        if (!this._hasNoListeners((x as Stream<any>)._listeners[i], trace.concat(x))) {
          return false
        }
      }
      return true
    } else {
      return false
    }
  }

  protected _stop (): void {
    if (this._subscription !== void 0) {
      this._subscription.unsubscribe()
      this._subscription = void 0
    }
    this._err = EMPTY
    this._stopId = EMPTY
  }

  subscribe (listener: Listener<T>): Subscription {
    this.addListener(listener)
    return new StreamSubscription(() => this.removeListener(listener))
  }

  _map<R> (project: (x: T) => R): Stream<R> | MemoryStream<R> {
    const ctor = this.ctor()
    return new ctor<R>(new MapOperator<T, R>(project, this))
  }

  map<R> (project: (x: T) => R): Stream<R> {
    return this._map(project) as Stream<R>
  }

  mapTo<R> (projectedValue: R): Stream<R> {
    return this.map<R>(() => projectedValue) as Stream<R>
  }

  _filter (predicate: Predicate<T>): Stream<T> | MemoryStream<T> {
    const ctor = this.ctor()
    return new ctor<T>(new FilterOperator<T>(predicate, this))
  }

  filter (predicate: Predicate<T>): Stream<T> {
    return this._filter(predicate) as Stream<T>
  }

  _take (amount: number): Stream<T> | MemoryStream<T> {
    const ctor = this.ctor()
    return new ctor<T>(new TakeOperator<T>(amount, this))
  }

  take (amount: number): Stream<T> {
    return this._take(amount) as Stream<T>
  }

  _drop (amount: number): Stream<T> | MemoryStream<T> {
    const ctor = this.ctor()
    return new ctor<T>(new DropOperator<T>(amount, this))
  }

  drop (amount: number): Stream<T> {
    return this._drop(amount) as Stream<T>
  }

  _last (): Stream<T> | MemoryStream<T> {
    const ctor = this.ctor()
    return new ctor<T>(new LastOperator<T>(this))
  }

  last (): Stream<T> {
    return this._last() as Stream<T>
  }

  startWith (value: T): MemoryStream<T> {
    return new MemoryStream<T>(new StartWithOperator<T>(value, this))
  }

  _endWhen (signal: Subscribable<any>): Stream<T> | MemoryStream<T> {
    const ctor = this.ctor()
    return new ctor<T>(new EndWhenOperator<T>(signal, this))
  }

  endWhen (signal: Subscribable<any>): Stream<T> {
    return this._endWhen(signal) as Stream<T>
  }

  fold<R> (fn: FoldFn<T, R>, seed: R): MemoryStream<R> {
    return new MemoryStream<R>(new FoldOperator<T, R>(fn, seed, this))
  }

  _replaceError (fn: ReplaceErrorFn<T>): Stream<T> | MemoryStream<T> {
    const ctor = this.ctor()
    return new ctor<T>(new ReplaceErrorOperator<T>(fn, this))
  }

  replaceError (fn: ReplaceErrorFn<T>): Stream<T> {
    return this._replaceError(fn) as Stream<T>
  }

  flatten<R> (): T {
    const ctor = this.ctor()
    const s = (<Subscribable<Subscribable<R>>> <any> this)
    return <T> <any> new ctor<R>(new FlattenOperator(s))
  }

  compose (fn: (subscribable: Stream<T>) => any) {
    return fn(this)
  }

  remember (): MemoryStream<T> {
    return new MemoryStream<T>(new RememberOperator<T>(this))
  }

  _debug (arg: string | ((x: T) => any)): Stream<T> | MemoryStream<T> {
    const spy = arg === 'function'
      ? (x: T) => { (arg as ((x: T) => any))(x); return x }
      : (x: T) => { console.log(`${arg}:`, x); return x }
    return this.map(spy)
  }

  debug (arg: string | ((x: T) => any)): Stream<T> {
    return this._debug(arg) as Stream<T>
  }

  imitate (target: Stream<T>): void {
    if (target instanceof MemoryStream) {
      throw new Error('A MemoryStream was given to imitate(), but it only ' +
        'supports a Stream. Read more about this restriction here: ' +
        'https://github.com/staltz/xstream#faq')
    }
    this._target = target
    forEach((listener: Listener<T>) => { target.addListener(listener) }, this._listeners)
    this._listeners = []
  }

  shamefullySendNext (x: T): void {
    const a = this._listeners
    const l = a.length
    if (l === 1) a[0].next(x); else {
      forEach((listener: Listener<T>) => { listener.next(x) }, copy(a))
    }
  }

  shamefullySendError (e: any): void {
    if (this._err !== EMPTY) return
    this._err = e
    const a = this._listeners
    const l = a.length
    if (l === 1) a[0].error(e); else {
      forEach((listener: Listener<T>) => { listener.error(e) }, copy(a))
    }
    this._cleanup()
  }

  shamefullySendComplete (): void {
    const a = this._listeners
    const l = a.length
    if (l === 1) a[0].complete(); else {
      forEach((listener: Listener<T>) => { listener.complete() }, copy(a))
    }
    this._cleanup()
  }

  protected _cleanup () {
    if (this._listeners.length === 0) return
    if (this._subscription !== EMPTY) this._subscription.unsubscribe()
    this._err = EMPTY
    this._listeners = []
  }
}

export class MemoryStream<T> extends Stream<T> {
  private _value: T
  private _has: boolean = false
  constructor (subscribable: Subscribable<T>) {
    super(subscribable)
  }

  addListener (listener: Listener<T>) {
    if (this._has) { listener.next(this._value) }
    super.addListener(listener)
  }

  _stop () {
    this._has = false
    super._stop()
  }

  shamefullySendNext (x: T) {
    this._value = x
    this._has = true
    super.shamefullySendNext(x)
  }

  _cleanup () {
    this._has = false
    super._cleanup()
  }

  map<R> (project: (x: T) => R): MemoryStream<R> {
    return this._map(project) as MemoryStream<R>
  }

  mapTo<R> (projectedValue: R): MemoryStream<R> {
    return this.map<R>(() => projectedValue) as MemoryStream<R>
  }

  filter (predicate: Predicate<T>): MemoryStream<T> {
    return this._filter(predicate) as MemoryStream<T>
  }

  take (amount: number): MemoryStream<T> {
    return this._take(amount) as MemoryStream<T>
  }

  drop (amount: number): MemoryStream<T> {
    return this._drop(amount) as MemoryStream<T>
  }

  last (): MemoryStream<T> {
    return this._last() as MemoryStream<T>
  }

  endWhen (signal: Subscribable<any>): MemoryStream<T> {
    return this._endWhen(signal) as MemoryStream<T>
  }

  replaceError (fn: ReplaceErrorFn<T>): MemoryStream<T> {
    return this._replaceError(fn) as MemoryStream<T>
  }

  debug (arg: string | ((x: T) => any)): MemoryStream<T> {
    return this._debug(arg) as MemoryStream<T>
  }
}

class StreamListener<T> implements Listener<T> {
  constructor (private stream: Stream<T>) {}

  next (x: T) {
    this.stream.shamefullySendNext(x)
  }

  error (e: any) {
    this.stream.shamefullySendError(e)
  }

  complete () {
    this.stream.shamefullySendComplete()
  }
}

export class StreamSubscription implements Subscription {
  constructor (private dispose: () => void) {}

  unsubscribe (): void {
    this.dispose()
  }
}

export class CompositeSubscription implements Subscription {
  constructor (private susbcriptions: Subscription[]) {}
  unsubscribe (): void {
    forEach((sub: Subscription) => sub.unsubscribe, this.susbcriptions)
  }
}
