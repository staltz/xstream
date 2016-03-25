import {Listener} from '../Listener';
import {Producer} from '../Producer';
import {Stream} from '../Stream';
import {emptyListener} from '../utils/emptyListener';
import {invoke} from '../utils/invoke';

export interface CombineProjectFunction {
  <T1, T2, R>(v1: T1, v2: T2): R;
  <T1, T2, T3, R>(v1: T1, v2: T2, v3: T3): R;
  <T1, T2, T3, T4, R>(v1: T1, v2: T2, v3: T3, v4: T4): R;
  <T1, T2, T3, T4, T5, R>(v1: T1, v2: T2, v3: T3, v4: T4, v5: T5): R;
  <T1, T2, T3, T4, T5, T6, R>(v1: T1, v2: T2, v3: T3, v4: T4, v5: T5, v6: T6): R;
  <R>(...values: Array<any>): R;
}

export interface CombineFactorySignature {
  <T1, T2, R>(
    project: (t1: T1, t2: T2) => R,
    stream2: Stream<T2>): Stream<R>;
  <T1, T2, T3, R>(
    project: (t1: T1, t2: T2, t3: T3) => R,
    stream2: Stream<T2>,
    stream3: Stream<T3>): Stream<R>;
  <T1, T2, T3, T4, R>(
    project: (t1: T1, t2: T2, t3: T3, t4: T4) => R,
    stream2: Stream<T2>,
    stream3: Stream<T3>,
    stream4: Stream<T4>): Stream<R>;
  <T1, T2, T3, T4, T5, R>(
    project: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5) => R,
    stream2: Stream<T2>,
    stream3: Stream<T3>,
    stream4: Stream<T4>,
    stream5: Stream<T5>): Stream<R>;
  <R>(project: (...args: Array<any>) => R, ...streams: Array<Stream<any>>): Stream<R>;
}

export interface CombineInstanceSignature<T> {
  <T2, R>(
    project: (t1: T, t2: T2) => R,
    stream2: Stream<T2>): Stream<R>;
  <T2, T3, R>(
    project: (t1: T, t2: T2, t3: T3) => R,
    stream2: Stream<T2>,
    stream3: Stream<T3>): Stream<R>;
  <T2, T3, T4, R>(
    project: (t1: T, t2: T2, t3: T3, t4: T4) => R,
    stream2: Stream<T2>,
    stream3: Stream<T3>,
    stream4: Stream<T4>): Stream<R>;
  <T2, T3, T4, T5, R>(
    project: (t1: T, t2: T2, t3: T3, t4: T4, t5: T5) => R,
    stream2: Stream<T2>,
    stream3: Stream<T3>,
    stream4: Stream<T4>,
    stream5: Stream<T5>): Stream<R>;
  <R>(project: (...args: Array<any>) => R, ...streams: Array<Stream<any>>): Stream<R>;
}

export class Proxy<T> implements Listener<T> {
  constructor(public i: number, public prod: CombineProducer<T>) {
    prod.proxies.push(this);
  }

  next(t: T): void {
    const prod = this.prod;
    prod.hasVal[this.i] = true;
    prod.vals[this.i] = t;
    if (!prod.ready) {
      prod.up();
    }
    if (prod.ready) {
      prod.out.next(invoke(prod.project, prod.vals));
    }
  }

  error(err: any): void {
    this.prod.out.error(err);
  }

  end(): void {
    const prod = this.prod;
    if (--prod.ac === 0) {
      prod.out.end();
    }
  }
}

export class CombineProducer<R> implements Producer<R> {
  public out: Listener<R> = emptyListener;
  public proxies: Array<Proxy<any>> = [];
  public ready: boolean = false;
  public hasVal: Array<boolean>;
  public vals: Array<any>;
  public streams: Array<Stream<any>>;
  public ac: number; // ac is activeCount

  constructor(public project: CombineProjectFunction, streams: Array<Stream<any>>) {
    this.streams = streams;
    this.vals = new Array(streams.length);
    this.hasVal = new Array(streams.length);
    this.ac = streams.length;
  }

  up(): void {
    for (let i = this.hasVal.length - 1; i >= 0; i--) {
      if (!this.hasVal[i]) {
        return;
      }
    }
    this.ready = true;
  }

  start(out: Listener<R>): void {
    this.out = out;
    for (let i = this.streams.length - 1; i >= 0; i--) {
      this.streams[i].addListener(new Proxy(i, this));
    }
  }

  stop(): void {
    for (let i = this.streams.length - 1; i >= 0; i--) {
      this.streams[i].removeListener(this.proxies[i]);
    }
    this.proxies = [];
  }
}
