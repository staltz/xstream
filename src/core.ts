import {Promise} from 'es6-promise';
import $$observable from 'symbol-observable';

const NO = {};
function noop() {}

function copy<T>(a: Array<T>): Array<T> {
  const l = a.length;
  const b = Array(l);
  for (let i = 0; i < l; ++i) {
    b[i] = a[i];
  }
  return b;
}

export interface InternalListener<T> {
  _n: (v: T) => void;
  _e: (err: any) => void;
  _c: () => void;
}

export const NO_IL: InternalListener<any> = {
  _n: noop,
  _e: noop,
  _c: noop,
};

export interface InternalProducer<T> {
  _start: (listener: InternalListener<T>) => void;
  _stop: () => void;
}

export interface OutSender<T> {
  out: Stream<T>;
}

export interface Operator<T, R> extends InternalProducer<R>, InternalListener<T>, OutSender<R> {
  type: string;
  ins: Stream<T>;
  _start: (out: Stream<R>) => void;
}

export interface Aggregator<T, U> extends InternalProducer<U>, OutSender<U> {
  type: string;
  insArr: Array<Stream<T>>;
  _start: (out: Stream<U>) => void;
}

export interface Producer<T> {
  start: (listener: Listener<T>) => void;
  stop: () => void;
}

export interface Listener<T> {
  next: (x: T) => void;
  error: (err: any) => void;
  complete: () => void;
}

export interface PartialListener<T> {
  next?: (x: T) => void;
  error?: (err: any) => void;
  complete?: () => void;
}

export type Observable<T> = {
  subscribe(listener: Listener<T>): { unsubscribe: () => void; }
}

export type FromInput<T> = Promise<T> | Stream<T> | Array<T> | Observable<T>;

// mutates the input
function internalizeProducer<T>(producer: Producer<T>) {
  (producer as InternalProducer<T> & Producer<T>)._start =
    function _start(il: InternalListener<T>) {
      (il as InternalListener<T> & Listener<T>).next = il._n;
      (il as InternalListener<T> & Listener<T>).error = il._e;
      (il as InternalListener<T> & Listener<T>).complete = il._c;
      this.start(il as InternalListener<T> & Listener<T>);
    };
  (producer as InternalProducer<T> & Producer<T>)._stop = producer.stop;
}

function and<T>(f1: (t: T) => boolean, f2: (t: T) => boolean): (t: T) => boolean {
  return function andFn(t: T): boolean {
    return f1(t) && f2(t);
  };
}

export class Subscription<T> {
  constructor(private _stream: Stream<T>, private _listener: Listener<T>) {}

  unsubscribe(): void {
    this._stream.removeListener(this._listener);
  }
}

class ObservableProducer<T> implements InternalProducer<T> {
  public type = 'fromObservable';
  public ins: any;
  public out: Stream<T>;
  private _subscription: { unsubscribe: () => void; };

  constructor(observable: any) {
    this.ins = observable;
  }

  _start(out: Stream<T>) {
    this.out = out;
    this._subscription = this.ins.subscribe(new ObservableListener(out));
  }

  _stop() {
    this._subscription.unsubscribe();
  }
}

class ObservableListener<T> implements Listener<T> {
  constructor(private _listener: InternalListener<T>) {}

  next(value: T) {
    this._listener._n(value);
  }

  error(err: any) {
    this._listener._e(err);
  }

  complete() {
    this._listener._c();
  }
}

export class MergeProducer<T> implements Aggregator<T, T>, InternalListener<T> {
  public type = 'merge';
  public insArr: Array<Stream<T>>;
  public out: Stream<T>;
  private ac: number; // ac is activeCount

  constructor(insArr: Array<Stream<T>>) {
    this.insArr = insArr;
    this.out = NO as Stream<T>;
    this.ac = 0;
  }

  _start(out: Stream<T>): void {
    this.out = out;
    const s = this.insArr;
    const L = s.length;
    this.ac = L;
    for (let i = 0; i < L; i++) {
      s[i]._add(this);
    }
  }

  _stop(): void {
    const s = this.insArr;
    const L = s.length;
    for (let i = 0; i < L; i++) {
      s[i]._remove(this);
    }
    this.out = NO as Stream<T>;
  }

  _n(t: T) {
    const u = this.out;
    if (u === NO) return;
    u._n(t);
  }

  _e(err: any) {
    const u = this.out;
    if (u === NO) return;
    u._e(err);
  }

  _c() {
    if (--this.ac <= 0) {
      const u = this.out;
      if (u === NO) return;
      u._c();
    }
  }
}

export interface MergeSignature {
  (): Stream<any>;
  <T1>(s1: Stream<T1>): Stream<T1>;
  <T1, T2>(
    s1: Stream<T1>,
    s2: Stream<T2>): Stream<T1 | T2>;
  <T1, T2, T3>(
    s1: Stream<T1>,
    s2: Stream<T2>,
    s3: Stream<T3>): Stream<T1 | T2 | T3>;
  <T1, T2, T3, T4>(
    s1: Stream<T1>,
    s2: Stream<T2>,
    s3: Stream<T3>,
    s4: Stream<T4>): Stream<T1 | T2 | T3 | T4>;
  <T1, T2, T3, T4, T5>(
    s1: Stream<T1>,
    s2: Stream<T2>,
    s3: Stream<T3>,
    s4: Stream<T4>,
    s5: Stream<T5>): Stream<T1 | T2 | T3 | T4 | T5>;
  <T1, T2, T3, T4, T5, T6>(
    s1: Stream<T1>,
    s2: Stream<T2>,
    s3: Stream<T3>,
    s4: Stream<T4>,
    s5: Stream<T5>,
    s6: Stream<T6>): Stream<T1 | T2 | T3 | T4 | T5 | T6>;
  <T1, T2, T3, T4, T5, T6, T7>(
    s1: Stream<T1>,
    s2: Stream<T2>,
    s3: Stream<T3>,
    s4: Stream<T4>,
    s5: Stream<T5>,
    s6: Stream<T6>,
    s7: Stream<T7>): Stream<T1 | T2 | T3 | T4 | T5 | T6 | T7>;
  <T1, T2, T3, T4, T5, T6, T7, T8>(
    s1: Stream<T1>,
    s2: Stream<T2>,
    s3: Stream<T3>,
    s4: Stream<T4>,
    s5: Stream<T5>,
    s6: Stream<T6>,
    s7: Stream<T7>,
    s8: Stream<T8>): Stream<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8>;
  <T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    s1: Stream<T1>,
    s2: Stream<T2>,
    s3: Stream<T3>,
    s4: Stream<T4>,
    s5: Stream<T5>,
    s6: Stream<T6>,
    s7: Stream<T7>,
    s8: Stream<T8>,
    s9: Stream<T9>): Stream<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9>;
  <T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
    s1: Stream<T1>,
    s2: Stream<T2>,
    s3: Stream<T3>,
    s4: Stream<T4>,
    s5: Stream<T5>,
    s6: Stream<T6>,
    s7: Stream<T7>,
    s8: Stream<T8>,
    s9: Stream<T9>,
    s10: Stream<T10>): Stream<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10>;
  <T>(...stream: Array<Stream<T>>): Stream<T>;
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
  <T1, T2, T3, T4, T5, T6, T7>(
    s1: Stream<T1>,
    s2: Stream<T2>,
    s3: Stream<T3>,
    s4: Stream<T4>,
    s5: Stream<T5>,
    s6: Stream<T6>,
    s7: Stream<T7>): Stream<[T1, T2, T3, T4, T5, T6, T7]>;
  <T1, T2, T3, T4, T5, T6, T7, T8>(
    s1: Stream<T1>,
    s2: Stream<T2>,
    s3: Stream<T3>,
    s4: Stream<T4>,
    s5: Stream<T5>,
    s6: Stream<T6>,
    s7: Stream<T7>,
    s8: Stream<T8>): Stream<[T1, T2, T3, T4, T5, T6, T7, T8]>;
  <T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    s1: Stream<T1>,
    s2: Stream<T2>,
    s3: Stream<T3>,
    s4: Stream<T4>,
    s5: Stream<T5>,
    s6: Stream<T6>,
    s7: Stream<T7>,
    s8: Stream<T8>,
    s9: Stream<T9>): Stream<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>;
  <T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
    s1: Stream<T1>,
    s2: Stream<T2>,
    s3: Stream<T3>,
    s4: Stream<T4>,
    s5: Stream<T5>,
    s6: Stream<T6>,
    s7: Stream<T7>,
    s8: Stream<T8>,
    s9: Stream<T9>,
    s10: Stream<T10>): Stream<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>;
  (...stream: Array<Stream<any>>): Stream<Array<any>>;
}

export class CombineListener<T> implements InternalListener<T>, OutSender<Array<T>> {
  private i: number;
  public out: Stream<Array<T>>;
  private p: CombineProducer<T>;

  constructor(i: number, out: Stream<Array<T>>, p: CombineProducer<T>) {
    this.i = i;
    this.out = out;
    this.p = p;
    p.ils.push(this);
  }

  _n(t: T): void {
    const p = this.p, out = this.out;
    if (out === NO) return;
    if (p.up(t, this.i)) {
      out._n(p.vals);
    }
  }

  _e(err: any): void {
    const out = this.out;
    if (out === NO) return;
    out._e(err);
  }

  _c(): void {
    const p = this.p;
    if (p.out === NO) return;
    if (--p.Nc === 0) {
      p.out._c();
    }
  }
}

export class CombineProducer<R> implements Aggregator<any, Array<R>> {
  public type = 'combine';
  public insArr: Array<Stream<any>>;
  public out: Stream<Array<R>>;
  public ils: Array<CombineListener<any>>;
  public Nc: number; // *N*umber of streams still to send *c*omplete
  public Nn: number; // *N*umber of streams still to send *n*ext
  public vals: Array<R>;

  constructor(insArr: Array<Stream<any>>) {
    this.insArr = insArr;
    this.out = NO as Stream<Array<R>>;
    this.ils = [];
    this.Nc = this.Nn = 0;
    this.vals = [];
  }

  up(t: any, i: number): boolean {
    const v = this.vals[i];
    const Nn = !this.Nn ? 0 : v === NO ? --this.Nn : this.Nn;
    this.vals[i] = t;
    return Nn === 0;
  }

  _start(out: Stream<Array<R>>): void {
    this.out = out;
    const s = this.insArr;
    const n = this.Nc = this.Nn = s.length;
    const vals = this.vals = new Array(n);
    if (n === 0) {
      out._n([]);
      out._c();
    } else {
      for (let i = 0; i < n; i++) {
        vals[i] = NO;
        s[i]._add(new CombineListener(i, out, this));
      }
    }
  }

  _stop(): void {
    const s = this.insArr;
    const n = s.length;
    const ils = this.ils;
    for (let i = 0; i < n; i++) {
      s[i]._remove(ils[i]);
    }
    this.out = NO as Stream<Array<R>>;
    this.ils = [];
    this.vals = [];
  }
}

export class FromArrayProducer<T> implements InternalProducer<T> {
  public type = 'fromArray';
  public a: Array<T>;

  constructor(a: Array<T>) {
    this.a = a;
  }

  _start(out: InternalListener<T>): void {
    const a = this.a;
    for (let i = 0, l = a.length; i < l; i++) {
      out._n(a[i]);
    }
    out._c();
  }

  _stop(): void {
  }
}

export class FromPromiseProducer<T> implements InternalProducer<T> {
  public type = 'fromPromise';
  public on: boolean;
  public p: Promise<T>;

  constructor(p: Promise<T>) {
    this.on = false;
    this.p = p;
  }

  _start(out: InternalListener<T>): void {
    const prod = this;
    this.on = true;
    this.p.then(
      (v: T) => {
        if (prod.on) {
          out._n(v);
          out._c();
        }
      },
      (e: any) => {
        out._e(e);
      }
    ).then(noop, (err: any) => {
      setTimeout(() => { throw err; });
    });
  }

  _stop(): void {
    this.on = false;
  }
}

export class PeriodicProducer implements InternalProducer<number> {
  public type = 'periodic';
  public period: number;
  private intervalID: any;
  private i: number;

  constructor(period: number) {
    this.period = period;
    this.intervalID = -1;
    this.i = 0;
  }

  _start(stream: InternalListener<number>): void {
    const self = this;
    function intervalHandler() { stream._n(self.i++); }
    this.intervalID = setInterval(intervalHandler, this.period);
  }

  _stop(): void {
    if (this.intervalID !== -1) clearInterval(this.intervalID);
    this.intervalID = -1;
    this.i = 0;
  }
}

export class DebugOperator<T> implements Operator<T, T> {
  public type = 'debug';
  public ins: Stream<T>;
  public out: Stream<T>;
  private s: (t: T) => any; // spy
  private l: string; // label

  constructor(ins: Stream<T>);
  constructor(ins: Stream<T>, arg?: string);
  constructor(ins: Stream<T>, arg?: (t: T) => any);
  constructor(ins: Stream<T>, arg?: string | ((t: T) => any));
  constructor(ins: Stream<T>, arg?: string | ((t: T) => any) | undefined) {
    this.ins = ins;
    this.out = NO as Stream<T>;
    this.s = noop;
    this.l = '';
    if (typeof arg === 'string') {
      this.l = arg;
    } else if (typeof arg === 'function') {
      this.s = arg;
    }
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = NO as Stream<T>;
  }

  _n(t: T) {
    const u = this.out;
    if (u === NO) return;
    const s = this.s, l = this.l;
    if (s !== noop) {
      try {
        s(t);
      } catch (e) {
        u._e(e);
      }
    } else if (l) {
      console.log(l + ':', t);
    } else {
      console.log(t);
    }
    u._n(t);
  }

  _e(err: any) {
    const u = this.out;
    if (u === NO) return;
    u._e(err);
  }

  _c() {
    const u = this.out;
    if (u === NO) return;
    u._c();
  }
}

export class DropOperator<T> implements Operator<T, T> {
  public type = 'drop';
  public ins: Stream<T>;
  public out: Stream<T>;
  public max: number;
  private dropped: number;

  constructor(max: number, ins: Stream<T>) {
    this.ins = ins;
    this.out = NO as Stream<T>;
    this.max = max;
    this.dropped = 0;
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.dropped = 0;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = NO as Stream<T>;
  }

  _n(t: T) {
    const u = this.out;
    if (u === NO) return;
    if (this.dropped++ >= this.max) u._n(t);
  }

  _e(err: any) {
    const u = this.out;
    if (u === NO) return;
    u._e(err);
  }

  _c() {
    const u = this.out;
    if (u === NO) return;
    u._c();
  }
}

class OtherIL<T> implements InternalListener<any> {
  private out: Stream<T>;
  private op: EndWhenOperator<T>;

  constructor(out: Stream<T>, op: EndWhenOperator<T>) {
    this.out = out;
    this.op = op;
  }

  _n(t: T) {
    this.op.end();
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.op.end();
  }
}

export class EndWhenOperator<T> implements Operator<T, T> {
  public type = 'endWhen';
  public ins: Stream<T>;
  public out: Stream<T>;
  public o: Stream<any>; // o = other
  private oil: InternalListener<any>; // oil = other InternalListener

  constructor(o: Stream<any>, ins: Stream<T>) {
    this.ins = ins;
    this.out = NO as Stream<T>;
    this.o = o;
    this.oil = NO_IL;
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.o._add(this.oil = new OtherIL(out, this));
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.o._remove(this.oil);
    this.out = NO as Stream<T>;
    this.oil = NO_IL;
  }

  end(): void {
    const u = this.out;
    if (u === NO) return;
    u._c();
  }

  _n(t: T) {
    const u = this.out;
    if (u === NO) return;
    u._n(t);
  }

  _e(err: any) {
    const u = this.out;
    if (u === NO) return;
    u._e(err);
  }

  _c() {
    this.end();
  }
}

export class FilterOperator<T> implements Operator<T, T> {
  public type = 'filter';
  public ins: Stream<T>;
  public out: Stream<T>;
  public passes: (t: T) => boolean;

  constructor(passes: (t: T) => boolean, ins: Stream<T>) {
    this.ins = ins;
    this.out = NO as Stream<T>;
    this.passes = passes;
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = NO as Stream<T>;
  }

  _n(t: T) {
    const u = this.out;
    if (u === NO) return;
    try {
      if (this.passes(t)) u._n(t);
    } catch (e) {
      u._e(e);
    }
  }

  _e(err: any) {
    const u = this.out;
    if (u === NO) return;
    u._e(err);
  }

  _c() {
    const u = this.out;
    if (u === NO) return;
    u._c();
  }
}

class FlattenListener<T> implements InternalListener<T> {
  private out: Stream<T>;
  private op: FlattenOperator<T>;

  constructor(out: Stream<T>, op: FlattenOperator<T>) {
    this.out = out;
    this.op = op;
  }

  _n(t: T) {
    this.out._n(t);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.op.inner = NO as Stream<T>;
    this.op.less();
  }
}

export class FlattenOperator<T> implements Operator<Stream<T>, T> {
  public type = 'flatten';
  public ins: Stream<Stream<T>>;
  public out: Stream<T>;
  private open: boolean;
  public inner: Stream<T>; // Current inner Stream
  private il: InternalListener<T>; // Current inner InternalListener

  constructor(ins: Stream<Stream<T>>) {
    this.ins = ins;
    this.out = NO as Stream<T>;
    this.open = true;
    this.inner = NO as Stream<T>;
    this.il = NO_IL;
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.open = true;
    this.inner = NO as Stream<T>;
    this.il = NO_IL;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    if (this.inner !== NO) this.inner._remove(this.il);
    this.out = NO as Stream<T>;
    this.open = true;
    this.inner = NO as Stream<T>;
    this.il = NO_IL;
  }

  less(): void {
    const u = this.out;
    if (u === NO) return;
    if (!this.open && this.inner === NO) u._c();
  }

  _n(s: Stream<T>) {
    const u = this.out;
    if (u === NO) return;
    const {inner, il} = this;
    if (inner !== NO && il !== NO_IL) inner._remove(il);
    (this.inner = s)._add(this.il = new FlattenListener(u, this));
  }

  _e(err: any) {
    const u = this.out;
    if (u === NO) return;
    u._e(err);
  }

  _c() {
    this.open = false;
    this.less();
  }
}

export class FoldOperator<T, R> implements Operator<T, R> {
  public type = 'fold';
  public ins: Stream<T>;
  public out: Stream<R>;
  public f: (acc: R, t: T) => R;
  public seed: R;
  private acc: R; // initialized as seed

  constructor(f: (acc: R, t: T) => R, seed: R, ins: Stream<T>) {
    this.ins = ins;
    this.out = NO as Stream<R>;
    this.f = f;
    this.acc = this.seed = seed;
  }

  _start(out: Stream<R>): void {
    this.out = out;
    this.acc = this.seed;
    out._n(this.acc);
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = NO as Stream<R>;
    this.acc = this.seed;
  }

  _n(t: T) {
    const u = this.out;
    if (u === NO) return;
    try {
      u._n(this.acc = this.f(this.acc, t));
    } catch (e) {
      u._e(e);
    }
  }

  _e(err: any) {
    const u = this.out;
    if (u === NO) return;
    u._e(err);
  }

  _c() {
    const u = this.out;
    if (u === NO) return;
    u._c();
  }
}

export class LastOperator<T> implements Operator<T, T> {
  public type = 'last';
  public ins: Stream<T>;
  public out: Stream<T>;
  private has: boolean;
  private val: T;

  constructor(ins: Stream<T>) {
    this.ins = ins;
    this.out = NO as Stream<T>;
    this.has = false;
    this.val = NO as T;
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.has = false;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = NO as Stream<T>;
    this.val = NO as T;
  }

  _n(t: T) {
    this.has = true;
    this.val = t;
  }

  _e(err: any) {
    const u = this.out;
    if (u === NO) return;
    u._e(err);
  }

  _c() {
    const u = this.out;
    if (u === NO) return;
    if (this.has) {
      u._n(this.val);
      u._c();
    } else {
      u._e('TODO show proper error');
    }
  }
}

class MapFlattenInner<R> implements InternalListener<R> {
  private out: Stream<R>;
  private op: MapFlattenOperator<any, R>;

  constructor(out: Stream<R>, op: MapFlattenOperator<any, R>) {
    this.out = out;
    this.op = op;
  }

  _n(r: R) {
    this.out._n(r);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.op.inner = NO as Stream<R>;
    this.op.less();
  }
}

export class MapFlattenOperator<T, R> implements Operator<T, R> {
  public type: string;
  public ins: Stream<T>;
  public out: Stream<R>;
  public mapOp: MapOperator<T, Stream<R>>;
  public inner: Stream<R>; // Current inner Stream
  private il: InternalListener<R>; // Current inner InternalListener
  private open: boolean;

  constructor(mapOp: MapOperator<T, Stream<R>>) {
    this.type = `${mapOp.type}+flatten`;
    this.ins = mapOp.ins;
    this.out = NO as Stream<R>;
    this.mapOp = mapOp;
    this.inner = NO as Stream<R>;
    this.il = NO_IL;
    this.open = true;
  }

  _start(out: Stream<R>): void {
    this.out = out;
    this.inner = NO as Stream<R>;
    this.il = NO_IL;
    this.open = true;
    this.mapOp.ins._add(this);
  }

  _stop(): void {
    this.mapOp.ins._remove(this);
    if (this.inner !== NO) this.inner._remove(this.il);
    this.out = NO as Stream<R>;
    this.inner = NO as Stream<R>;
    this.il = NO_IL;
  }

  less(): void {
    if (!this.open && this.inner === NO) {
      const u = this.out;
      if (u === NO) return;
      u._c();
    }
  }

  _n(v: T) {
    const u = this.out;
    if (u === NO) return;
    const {inner, il} = this;
    let s: Stream<R>;
    try {
      s = this.mapOp.project(v);
    } catch (e) {
      u._e(e);
      return;
    }
    if (inner !== NO && il !== NO_IL) inner._remove(il);
    (this.inner = s)._add(this.il = new MapFlattenInner(u, this));
  }

  _e(err: any) {
    const u = this.out;
    if (u === NO) return;
    u._e(err);
  }

  _c() {
    this.open = false;
    this.less();
  }
}

export class MapOperator<T, R> implements Operator<T, R> {
  public type = 'map';
  public ins: Stream<T>;
  public out: Stream<R>;
  public project: (t: T) => R;

  constructor(project: (t: T) => R, ins: Stream<T>) {
    this.ins = ins;
    this.out = NO as Stream<R>;
    this.project = project;
  }

  _start(out: Stream<R>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = NO as Stream<R>;
  }

  _n(t: T) {
    const u = this.out;
    if (u === NO) return;
    try {
      u._n(this.project(t));
    } catch (e) {
      u._e(e);
    }
  }

  _e(err: any) {
    const u = this.out;
    if (u === NO) return;
    u._e(err);
  }

  _c() {
    const u = this.out;
    if (u === NO) return;
    u._c();
  }
}

export class FilterMapOperator<T, R> extends MapOperator<T, R> {
  public type = 'filter+map';
  public passes: (t: T) => boolean;

  constructor(passes: (t: T) => boolean, project: (t: T) => R, ins: Stream<T>) {
    super(project, ins);
    this.passes = passes;
  }

  _n(t: T) {
    if (!this.passes(t)) return;
    const u = this.out;
    if (u === NO) return;
    try {
      u._n(this.project(t));
    } catch (e) {
      u._e(e);
    }
  }
}

export class RememberOperator<T> implements InternalProducer<T> {
  public type = 'remember';
  public ins: Stream<T>;
  public out: Stream<T>;

  constructor(ins: Stream<T>) {
    this.ins = ins;
    this.out = NO as Stream<T>;
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(out);
  }

  _stop(): void {
    this.ins._remove(this.out);
    this.out = NO as Stream<T>;
  }
}

export class ReplaceErrorOperator<T> implements Operator<T, T> {
  public type = 'replaceError';
  public ins: Stream<T>;
  public out: Stream<T>;
  public fn: (err: any) => Stream<T>;

  constructor(fn: (err: any) => Stream<T>, ins: Stream<T>) {
    this.ins = ins;
    this.out = NO as Stream<T>;
    this.fn = fn;
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = NO as Stream<T>;
  }

  _n(t: T) {
    const u = this.out;
    if (u === NO) return;
    u._n(t);
  }

  _e(err: any) {
    const u = this.out;
    if (u === NO) return;
    try {
      this.ins._remove(this);
      (this.ins = this.fn(err))._add(this);
    } catch (e) {
      u._e(e);
    }
  }

  _c() {
    const u = this.out;
    if (u === NO) return;
    u._c();
  }
}

export class StartWithOperator<T> implements InternalProducer<T> {
  public type = 'startWith';
  public ins: Stream<T>;
  public out: Stream<T>;
  public val: T;

  constructor(ins: Stream<T>, val: T) {
    this.ins = ins;
    this.out = NO as Stream<T>;
    this.val = val;
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.out._n(this.val);
    this.ins._add(out);
  }

  _stop(): void {
    this.ins._remove(this.out);
    this.out = NO as Stream<T>;
  }
}

export class TakeOperator<T> implements Operator<T, T> {
  public type = 'take';
  public ins: Stream<T>;
  public out: Stream<T>;
  public max: number;
  private taken: number;

  constructor(max: number, ins: Stream<T>) {
    this.ins = ins;
    this.out = NO as Stream<T>;
    this.max = max;
    this.taken = 0;
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.taken = 0;
    if (this.max <= 0) {
      out._c();
    } else {
      this.ins._add(this);
    }
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = NO as Stream<T>;
  }

  _n(t: T) {
    const u = this.out;
    if (u === NO) return;
    if (this.taken++ < this.max - 1) {
      u._n(t);
    } else {
      u._n(t);
      u._c();
    }
  }

  _e(err: any) {
    const u = this.out;
    if (u === NO) return;
    u._e(err);
  }

  _c() {
    const u = this.out;
    if (u === NO) return;
    u._c();
  }
}

export class Stream<T> implements InternalListener<T> {
  public _prod: InternalProducer<T>;
  protected _ils: Array<InternalListener<T>>; // 'ils' = Internal listeners
  protected _stopID: any;
  protected _dl: InternalListener<T>; // the debug listener
  protected _d: boolean; // flag indicating the existence of the debug listener
  protected _target: Stream<T>; // imitation target if this Stream will imitate
  protected _err: any;

  constructor(producer?: InternalProducer<T>) {
    this._prod = producer || NO as InternalProducer<T>;
    this._ils = [];
    this._stopID = NO;
    this._dl = NO as InternalListener<T>;
    this._d = false;
    this._target = NO as Stream<T>;
    this._err = NO;
  }

  _n(t: T): void {
    const a = this._ils;
    const L = a.length;
    if (this._d) this._dl._n(t);
    if (L == 1) a[0]._n(t); else {
      const b = copy(a);
      for (let i = 0; i < L; i++) b[i]._n(t);
    }
  }

  _e(err: any): void {
    if (this._err !== NO) return;
    this._err = err;
    const a = this._ils;
    const L = a.length;
    this._x();
    if (this._d) this._dl._e(err);
    if (L == 1) a[0]._e(err); else {
      const b = copy(a);
      for (let i = 0; i < L; i++) b[i]._e(err);
    }
  }

  _c(): void {
    const a = this._ils;
    const L = a.length;
    this._x();
    if (this._d) this._dl._c();
    if (L == 1) a[0]._c(); else {
      const b = copy(a);
      for (let i = 0; i < L; i++) b[i]._c();
    }
  }

  _x(): void { // tear down logic, after error or complete
    if (this._ils.length === 0) return;
    if (this._prod !== NO) this._prod._stop();
    this._err = NO;
    this._ils = [];
  }

  _stopNow() {
    // WARNING: code that calls this method should
    // first check if this._prod is valid (not `NO`)
    this._prod._stop();
    this._err = NO;
    this._stopID = NO;
  }

  _add(il: InternalListener<T>): void {
    const ta = this._target;
    if (ta !== NO) return ta._add(il);
    const a = this._ils;
    a.push(il);
    if (a.length > 1) return;
    if (this._stopID !== NO) {
      clearTimeout(this._stopID);
      this._stopID = NO;
    } else {
      const p = this._prod;
      if (p !== NO) p._start(this);
    }
  }

  _remove(il: InternalListener<T>): void {
    const ta = this._target;
    if (ta !== NO) return ta._remove(il);
    const a = this._ils;
    const i = a.indexOf(il);
    if (i > -1) {
      a.splice(i, 1);
      if (this._prod !== NO && a.length <= 0) {
        this._err = NO;
        this._stopID = setTimeout(() => this._stopNow());
      } else if (a.length === 1) {
        this._pruneCycles();
      }
    }
  }

  // If all paths stemming from `this` stream eventually end at `this`
  // stream, then we remove the single listener of `this` stream, to
  // force it to end its execution and dispose resources. This method
  // assumes as a precondition that this._ils has just one listener.
  _pruneCycles() {
    if (this._hasNoSinks(this, [])) {
      this._remove(this._ils[0]);
    }
  }

  // Checks whether *there is no* path starting from `x` that leads to an end
  // listener (sink) in the stream graph, following edges A->B where B is a
  // listener of A. This means these paths constitute a cycle somehow. Is given
  // a trace of all visited nodes so far.
  _hasNoSinks(x: InternalListener<any>, trace: Array<any>): boolean {
    if (trace.indexOf(x) !== -1) {
      return true;
    } else if ((x as any as OutSender<any>).out === this) {
      return true;
    } else if ((x as any as OutSender<any>).out && (x as any as OutSender<any>).out !== NO) {
      return this._hasNoSinks((x as any as OutSender<any>).out, trace.concat(x));
    } else if ((x as Stream<any>)._ils) {
      for (let i = 0, N = (x as Stream<any>)._ils.length; i < N; i++) {
        if (!this._hasNoSinks((x as Stream<any>)._ils[i], trace.concat(x))) {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  }

  private ctor(): typeof Stream {
    return this instanceof MemoryStream ? MemoryStream : Stream;
  }

  /**
   * Adds a Listener to the Stream.
   *
   * @param {Listener<T>} listener
   */
  addListener(listener: PartialListener<T>): void {
    (listener as InternalListener<T> & Listener<T>)._n = listener.next || noop;
    (listener as InternalListener<T> & Listener<T>)._e = listener.error || noop;
    (listener as InternalListener<T> & Listener<T>)._c = listener.complete || noop;
    this._add(listener as InternalListener<T> & Listener<T>);
  }

  /**
   * Removes a Listener from the Stream, assuming the Listener was added to it.
   *
   * @param {Listener<T>} listener
   */
  removeListener(listener: Listener<T>): void {
    this._remove(listener as InternalListener<T> & Listener<T>);
  }

  /**
   * Adds a Listener to the Stream returning a Subscription to remove that
   * listener.
   *
   * @param {Listener} listener
   * @returns {Subscription}
   */
  subscribe(listener: Listener<T>): Subscription<T> {
    this.addListener(listener);

    return new Subscription<T>(this, listener);
  }

  /**
   * Add interop between most.js and RxJS 5
   *
   * @returns {Stream}
   */
  [$$observable](): Stream<T> {
    return this;
  }

  /**
   * Creates a new Stream given a Producer.
   *
   * @factory true
   * @param {Producer} producer An optional Producer that dictates how to
   * start, generate events, and stop the Stream.
   * @return {Stream}
   */
  static create<T>(producer?: Producer<T>): Stream<T> {
    if (producer) {
      if (typeof producer.start !== 'function'
      || typeof producer.stop !== 'function') {
        throw new Error('producer requires both start and stop functions');
      }
      internalizeProducer(producer); // mutates the input
    }
    return new Stream(producer as InternalProducer<T> & Producer<T>);
  }

  /**
   * Creates a new MemoryStream given a Producer.
   *
   * @factory true
   * @param {Producer} producer An optional Producer that dictates how to
   * start, generate events, and stop the Stream.
   * @return {MemoryStream}
   */
  static createWithMemory<T>(producer?: Producer<T>): MemoryStream<T> {
    if (producer) {
      internalizeProducer(producer); // mutates the input
    }
    return new MemoryStream<T>(producer as InternalProducer<T> & Producer<T>);
  }

  /**
   * Creates a Stream that does nothing when started. It never emits any event.
   *
   * Marble diagram:
   *
   * ```text
   *          never
   * -----------------------
   * ```
   *
   * @factory true
   * @return {Stream}
   */
  static never(): Stream<any> {
    return new Stream<any>({_start: noop, _stop: noop});
  }

  /**
   * Creates a Stream that immediately emits the "complete" notification when
   * started, and that's it.
   *
   * Marble diagram:
   *
   * ```text
   * empty
   * -|
   * ```
   *
   * @factory true
   * @return {Stream}
   */
  static empty(): Stream<any> {
    return new Stream<any>({
      _start(il: InternalListener<any>) { il._c(); },
      _stop: noop,
    });
  }

  /**
   * Creates a Stream that immediately emits an "error" notification with the
   * value you passed as the `error` argument when the stream starts, and that's
   * it.
   *
   * Marble diagram:
   *
   * ```text
   * throw(X)
   * -X
   * ```
   *
   * @factory true
   * @param error The error event to emit on the created stream.
   * @return {Stream}
   */
  static throw(error: any): Stream<any> {
    return new Stream<any>({
      _start(il: InternalListener<any>) { il._e(error); },
      _stop: noop,
    });
  }

  /**
   * Creates a stream from an Array, Promise, or an Observable.
   *
   * @factory true
   * @param {Array|Promise|Observable} input The input to make a stream from.
   * @return {Stream}
   */
  static from<T>(input: FromInput<T>): Stream<T> {
    if (typeof input[$$observable] === 'function') {
      return Stream.fromObservable<T>(input);
    } else if (typeof (input as Promise<T>).then === 'function') {
      return Stream.fromPromise<T>(input as Promise<T>);
    } else if (Array.isArray(input)) {
      return Stream.fromArray<T>(input);
    }

    throw new TypeError(`Type of input to from() must be an Array, Promise, or Observable`);
  }

  /**
   * Creates a Stream that immediately emits the arguments that you give to
   * *of*, then completes.
   *
   * Marble diagram:
   *
   * ```text
   * of(1,2,3)
   * 123|
   * ```
   *
   * @factory true
   * @param a The first value you want to emit as an event on the stream.
   * @param b The second value you want to emit as an event on the stream. One
   * or more of these values may be given as arguments.
   * @return {Stream}
   */
  static of<T>(...items: Array<T>): Stream<T> {
    return Stream.fromArray<T>(items);
  }

  /**
   * Converts an array to a stream. The returned stream will emit synchronously
   * all the items in the array, and then complete.
   *
   * Marble diagram:
   *
   * ```text
   * fromArray([1,2,3])
   * 123|
   * ```
   *
   * @factory true
   * @param {Array} array The array to be converted as a stream.
   * @return {Stream}
   */
  static fromArray<T>(array: Array<T>): Stream<T> {
    return new Stream<T>(new FromArrayProducer<T>(array));
  }

  /**
   * Converts a promise to a stream. The returned stream will emit the resolved
   * value of the promise, and then complete. However, if the promise is
   * rejected, the stream will emit the corresponding error.
   *
   * Marble diagram:
   *
   * ```text
   * fromPromise( ----42 )
   * -----------------42|
   * ```
   *
   * @factory true
   * @param {Promise} promise The promise to be converted as a stream.
   * @return {Stream}
   */
  static fromPromise<T>(promise: Promise<T>): Stream<T> {
    return new Stream<T>(new FromPromiseProducer<T>(promise));
  }

  /**
   * Converts an Observable into a Stream.
   *
   * @factory true
   * @param {any} observable The observable to be converted as a stream.
   * @return {Stream}
   */
  static fromObservable<T>(observable: any): Stream<T> {
    return new Stream<T>(new ObservableProducer(observable));
  }

  /**
   * Creates a stream that periodically emits incremental numbers, every
   * `period` milliseconds.
   *
   * Marble diagram:
   *
   * ```text
   *     periodic(1000)
   * ---0---1---2---3---4---...
   * ```
   *
   * @factory true
   * @param {number} period The interval in milliseconds to use as a rate of
   * emission.
   * @return {Stream}
   */
  static periodic(period: number): Stream<number> {
    return new Stream<number>(new PeriodicProducer(period));
  }

  /**
   * Blends multiple streams together, emitting events from all of them
   * concurrently.
   *
   * *merge* takes multiple streams as arguments, and creates a stream that
   * behaves like each of the argument streams, in parallel.
   *
   * Marble diagram:
   *
   * ```text
   * --1----2-----3--------4---
   * ----a-----b----c---d------
   *            merge
   * --1-a--2--b--3-c---d--4---
   * ```
   *
   * @factory true
   * @param {Stream} stream1 A stream to merge together with other streams.
   * @param {Stream} stream2 A stream to merge together with other streams. Two
   * or more streams may be given as arguments.
   * @return {Stream}
   */
  static merge: MergeSignature = function merge(...streams: Array<Stream<any>>) {
    return new Stream<any>(new MergeProducer(streams));
  } as MergeSignature;

  /**
   * Combines multiple input streams together to return a stream whose events
   * are arrays that collect the latest events from each input stream.
   *
   * *combine* internally remembers the most recent event from each of the input
   * streams. When any of the input streams emits an event, that event together
   * with all the other saved events are combined into an array. That array will
   * be emitted on the output stream. It's essentially a way of joining together
   * the events from multiple streams.
   *
   * Marble diagram:
   *
   * ```text
   * --1----2-----3--------4---
   * ----a-----b-----c--d------
   *          combine
   * ----1a-2a-2b-3b-3c-3d-4d--
   * ```
   *
   * @factory true
   * @param {Stream} stream1 A stream to combine together with other streams.
   * @param {Stream} stream2 A stream to combine together with other streams.
   * Multiple streams, not just two, may be given as arguments.
   * @return {Stream}
   */
  static combine: CombineSignature = function combine(...streams: Array<Stream<any>>) {
    return new Stream<Array<any>>(new CombineProducer<any>(streams));
  } as CombineSignature;

  protected _map<U>(project: (t: T) => U): Stream<U> | MemoryStream<U> {
    const p = this._prod;
    const ctor = this.ctor();
    if (p instanceof FilterOperator) {
      return new ctor<U>(new FilterMapOperator<T, U>(p.passes, project, p.ins));
    }
    return new ctor<U>(new MapOperator<T, U>(project, this));
  }

  /**
   * Transforms each event from the input Stream through a `project` function,
   * to get a Stream that emits those transformed events.
   *
   * Marble diagram:
   *
   * ```text
   * --1---3--5-----7------
   *    map(i => i * 10)
   * --10--30-50----70-----
   * ```
   *
   * @param {Function} project A function of type `(t: T) => U` that takes event
   * `t` of type `T` from the input Stream and produces an event of type `U`, to
   * be emitted on the output Stream.
   * @return {Stream}
   */
  map<U>(project: (t: T) => U): Stream<U> {
    return this._map(project);
  }

  /**
   * It's like `map`, but transforms each input event to always the same
   * constant value on the output Stream.
   *
   * Marble diagram:
   *
   * ```text
   * --1---3--5-----7-----
   *       mapTo(10)
   * --10--10-10----10----
   * ```
   *
   * @param projectedValue A value to emit on the output Stream whenever the
   * input Stream emits any value.
   * @return {Stream}
   */
  mapTo<U>(projectedValue: U): Stream<U> {
    const s = this.map(() => projectedValue);
    const op: Operator<T, U> = s._prod as Operator<T, U>;
    op.type = op.type.replace('map', 'mapTo');
    return s;
  }

  filter<S extends T>(passes: (t: T) => t is S): Stream<S>;
  filter(passes: (t: T) => boolean): Stream<T>;
  /**
   * Only allows events that pass the test given by the `passes` argument.
   *
   * Each event from the input stream is given to the `passes` function. If the
   * function returns `true`, the event is forwarded to the output stream,
   * otherwise it is ignored and not forwarded.
   *
   * Marble diagram:
   *
   * ```text
   * --1---2--3-----4-----5---6--7-8--
   *     filter(i => i % 2 === 0)
   * ------2--------4---------6----8--
   * ```
   *
   * @param {Function} passes A function of type `(t: T) +> boolean` that takes
   * an event from the input stream and checks if it passes, by returning a
   * boolean.
   * @return {Stream}
   */
  filter(passes: (t: T) => boolean): Stream<T> {
    const p = this._prod;
    if (p instanceof FilterOperator) {
      return new Stream<T>(new FilterOperator<T>(
        and((p as FilterOperator<T>).passes, passes),
        (p as FilterOperator<T>).ins
      ));
    }
    return new Stream<T>(new FilterOperator<T>(passes, this));
  }

  /**
   * Lets the first `amount` many events from the input stream pass to the
   * output stream, then makes the output stream complete.
   *
   * Marble diagram:
   *
   * ```text
   * --a---b--c----d---e--
   *    take(3)
   * --a---b--c|
   * ```
   *
   * @param {number} amount How many events to allow from the input stream
   * before completing the output stream.
   * @return {Stream}
   */
  take(amount: number): Stream<T> {
    return new (this.ctor())<T>(new TakeOperator<T>(amount, this));
  }

  /**
   * Ignores the first `amount` many events from the input stream, and then
   * after that starts forwarding events from the input stream to the output
   * stream.
   *
   * Marble diagram:
   *
   * ```text
   * --a---b--c----d---e--
   *       drop(3)
   * --------------d---e--
   * ```
   *
   * @param {number} amount How many events to ignore from the input stream
   * before forwarding all events from the input stream to the output stream.
   * @return {Stream}
   */
  drop(amount: number): Stream<T> {
    return new Stream<T>(new DropOperator<T>(amount, this));
  }

  /**
   * When the input stream completes, the output stream will emit the last event
   * emitted by the input stream, and then will also complete.
   *
   * Marble diagram:
   *
   * ```text
   * --a---b--c--d----|
   *       last()
   * -----------------d|
   * ```
   *
   * @return {Stream}
   */
  last(): Stream<T> {
    return new Stream<T>(new LastOperator<T>(this));
  }

  /**
   * Prepends the given `initial` value to the sequence of events emitted by the
   * input stream. The returned stream is a MemoryStream, which means it is
   * already `remember()`'d.
   *
   * Marble diagram:
   *
   * ```text
   * ---1---2-----3---
   *   startWith(0)
   * 0--1---2-----3---
   * ```
   *
   * @param initial The value or event to prepend.
   * @return {MemoryStream}
   */
  startWith(initial: T): MemoryStream<T> {
    return new MemoryStream<T>(new StartWithOperator<T>(this, initial));
  }

  /**
   * Uses another stream to determine when to complete the current stream.
   *
   * When the given `other` stream emits an event or completes, the output
   * stream will complete. Before that happens, the output stream will behaves
   * like the input stream.
   *
   * Marble diagram:
   *
   * ```text
   * ---1---2-----3--4----5----6---
   *   endWhen( --------a--b--| )
   * ---1---2-----3--4--|
   * ```
   *
   * @param other Some other stream that is used to know when should the output
   * stream of this operator complete.
   * @return {Stream}
   */
  endWhen(other: Stream<any>): Stream<T> {
    return new (this.ctor())<T>(new EndWhenOperator<T>(other, this));
  }

  /**
   * "Folds" the stream onto itself.
   *
   * Combines events from the past throughout
   * the entire execution of the input stream, allowing you to accumulate them
   * together. It's essentially like `Array.prototype.reduce`. The returned
   * stream is a MemoryStream, which means it is already `remember()`'d.
   *
   * The output stream starts by emitting the `seed` which you give as argument.
   * Then, when an event happens on the input stream, it is combined with that
   * seed value through the `accumulate` function, and the output value is
   * emitted on the output stream. `fold` remembers that output value as `acc`
   * ("accumulator"), and then when a new input event `t` happens, `acc` will be
   * combined with that to produce the new `acc` and so forth.
   *
   * Marble diagram:
   *
   * ```text
   * ------1-----1--2----1----1------
   *   fold((acc, x) => acc + x, 3)
   * 3-----4-----5--7----8----9------
   * ```
   *
   * @param {Function} accumulate A function of type `(acc: R, t: T) => R` that
   * takes the previous accumulated value `acc` and the incoming event from the
   * input stream and produces the new accumulated value.
   * @param seed The initial accumulated value, of type `R`.
   * @return {MemoryStream}
   */
  fold<R>(accumulate: (acc: R, t: T) => R, seed: R): MemoryStream<R> {
    return new MemoryStream<R>(new FoldOperator<T, R>(accumulate, seed, this));
  }

  /**
   * Replaces an error with another stream.
   *
   * When (and if) an error happens on the input stream, instead of forwarding
   * that error to the output stream, *replaceError* will call the `replace`
   * function which returns the stream that the output stream will replicate.
   * And, in case that new stream also emits an error, `replace` will be called
   * again to get another stream to start replicating.
   *
   * Marble diagram:
   *
   * ```text
   * --1---2-----3--4-----X
   *   replaceError( () => --10--| )
   * --1---2-----3--4--------10--|
   * ```
   *
   * @param {Function} replace A function of type `(err) => Stream` that takes
   * the error that occurred on the input stream or on the previous replacement
   * stream and returns a new stream. The output stream will behave like the
   * stream that this function returns.
   * @return {Stream}
   */
  replaceError(replace: (err: any) => Stream<T>): Stream<T> {
    return new (this.ctor())<T>(new ReplaceErrorOperator<T>(replace, this));
  }

  /**
   * Flattens a "stream of streams", handling only one nested stream at a time
   * (no concurrency).
   *
   * If the input stream is a stream that emits streams, then this operator will
   * return an output stream which is a flat stream: emits regular events. The
   * flattening happens without concurrency. It works like this: when the input
   * stream emits a nested stream, *flatten* will start imitating that nested
   * one. However, as soon as the next nested stream is emitted on the input
   * stream, *flatten* will forget the previous nested one it was imitating, and
   * will start imitating the new nested one.
   *
   * Marble diagram:
   *
   * ```text
   * --+--------+---------------
   *   \        \
   *    \       ----1----2---3--
   *    --a--b----c----d--------
   *           flatten
   * -----a--b------1----2---3--
   * ```
   *
   * @return {Stream}
   */
  flatten<R>(): T {
    const p = this._prod;
    return new Stream<R>(
      p instanceof MapOperator && !(p instanceof FilterMapOperator) ?
        new MapFlattenOperator(p as MapOperator<any, Stream<R>>) :
        new FlattenOperator(this as any as Stream<Stream<R>>)
    ) as T & Stream<R>;
  }

  /**
   * Passes the input stream to a custom operator, to produce an output stream.
   *
   * *compose* is a handy way of using an existing function in a chained style.
   * Instead of writing `outStream = f(inStream)` you can write
   * `outStream = inStream.compose(f)`.
   *
   * @param {function} operator A function that takes a stream as input and
   * returns a stream as well.
   * @return {Stream}
   */
  compose<U>(operator: (stream: Stream<T>) => Stream<U>): Stream<U> {
    return operator(this);
  }

  /**
   * Returns an output stream that behaves like the input stream, but also
   * remembers the most recent event that happens on the input stream, so that a
   * newly added listener will immediately receive that memorised event.
   *
   * @return {MemoryStream}
   */
  remember(): MemoryStream<T> {
    return new MemoryStream<T>(new RememberOperator<T>(this));
  }

  debug(): Stream<T>;
  debug(labelOrSpy: string): Stream<T>;
  debug(labelOrSpy: (t: T) => any): Stream<T>;
  /**
   * Returns an output stream that identically behaves like the input stream,
   * but also runs a `spy` function fo each event, to help you debug your app.
   *
   * *debug* takes a `spy` function as argument, and runs that for each event
   * happening on the input stream. If you don't provide the `spy` argument,
   * then *debug* will just `console.log` each event. This helps you to
   * understand the flow of events through some operator chain.
   *
   * Please note that if the output stream has no listeners, then it will not
   * start, which means `spy` will never run because no actual event happens in
   * that case.
   *
   * Marble diagram:
   *
   * ```text
   * --1----2-----3-----4--
   *         debug
   * --1----2-----3-----4--
   * ```
   *
   * @param {function} labelOrSpy A string to use as the label when printing
   * debug information on the console, or a 'spy' function that takes an event
   * as argument, and does not need to return anything.
   * @return {Stream}
   */
  debug(labelOrSpy?: string | ((t: T) => any)): Stream<T> {
    return new (this.ctor())<T>(new DebugOperator<T>(this, labelOrSpy));
  }

  /**
   * *imitate* changes this current Stream to emit the same events that the
   * `other` given Stream does. This method returns nothing.
   *
   * This method exists to allow one thing: **circular dependency of streams**.
   * For instance, let's imagine that for some reason you need to create a
   * circular dependency where stream `first$` depends on stream `second$`
   * which in turn depends on `first$`:
   *
   * <!-- skip-example -->
   * ```js
   * import delay from 'xstream/extra/delay'
   *
   * var first$ = second$.map(x => x * 10).take(3);
   * var second$ = first$.map(x => x + 1).startWith(1).compose(delay(100));
   * ```
   *
   * However, that is invalid JavaScript, because `second$` is undefined
   * on the first line. This is how *imitate* can help solve it:
   *
   * ```js
   * import delay from 'xstream/extra/delay'
   *
   * var secondProxy$ = xs.create();
   * var first$ = secondProxy$.map(x => x * 10).take(3);
   * var second$ = first$.map(x => x + 1).startWith(1).compose(delay(100));
   * secondProxy$.imitate(second$);
   * ```
   *
   * We create `secondProxy$` before the others, so it can be used in the
   * declaration of `first$`. Then, after both `first$` and `second$` are
   * defined, we hook `secondProxy$` with `second$` with `imitate()` to tell
   * that they are "the same". `imitate` will not trigger the start of any
   * stream, it just binds `secondProxy$` and `second$` together.
   *
   * The following is an example where `imitate()` is important in Cycle.js
   * applications. A parent component contains some child components. A child
   * has an action stream which is given to the parent to define its state:
   *
   * <!-- skip-example -->
   * ```js
   * const childActionProxy$ = xs.create();
   * const parent = Parent({...sources, childAction$: childActionProxy$});
   * const childAction$ = parent.state$.map(s => s.child.action$).flatten();
   * childActionProxy$.imitate(childAction$);
   * ```
   *
   * Note, though, that **`imitate()` does not support MemoryStreams**. If we
   * would attempt to imitate a MemoryStream in a circular dependency, we would
   * either get a race condition (where the symptom would be "nothing happens")
   * or an infinite cyclic emission of values. It's useful to think about
   * MemoryStreams as cells in a spreadsheet. It doesn't make any sense to
   * define a spreadsheet cell `A1` with a formula that depends on `B1` and
   * cell `B1` defined with a formula that depends on `A1`.
   *
   * If you find yourself wanting to use `imitate()` with a
   * MemoryStream, you should rework your code around `imitate()` to use a
   * Stream instead. Look for the stream in the circular dependency that
   * represents an event stream, and that would be a candidate for creating a
   * proxy Stream which then imitates the target Stream.
   *
   * @param {Stream} target The other stream to imitate on the current one. Must
   * not be a MemoryStream.
   */
  imitate(target: Stream<T>): void {
    if (target instanceof MemoryStream) {
      throw new Error('A MemoryStream was given to imitate(), but it only ' +
      'supports a Stream. Read more about this restriction here: ' +
      'https://github.com/staltz/xstream#faq');
    }
    this._target = target;
    for (let ils = this._ils, N = ils.length, i = 0; i < N; i++) {
      target._add(ils[i]);
    }
    this._ils = [];
  }

  /**
   * Forces the Stream to emit the given value to its listeners.
   *
   * As the name indicates, if you use this, you are most likely doing something
   * The Wrong Way. Please try to understand the reactive way before using this
   * method. Use it only when you know what you are doing.
   *
   * @param value The "next" value you want to broadcast to all listeners of
   * this Stream.
   */
  shamefullySendNext(value: T) {
    this._n(value);
  }

  /**
   * Forces the Stream to emit the given error to its listeners.
   *
   * As the name indicates, if you use this, you are most likely doing something
   * The Wrong Way. Please try to understand the reactive way before using this
   * method. Use it only when you know what you are doing.
   *
   * @param {any} error The error you want to broadcast to all the listeners of
   * this Stream.
   */
  shamefullySendError(error: any) {
    this._e(error);
  }

  /**
   * Forces the Stream to emit the "completed" event to its listeners.
   *
   * As the name indicates, if you use this, you are most likely doing something
   * The Wrong Way. Please try to understand the reactive way before using this
   * method. Use it only when you know what you are doing.
   */
  shamefullySendComplete() {
    this._c();
  }

  /**
   * Adds a "debug" listener to the stream. There can only be one debug
   * listener, that's why this is 'setDebugListener'. To remove the debug
   * listener, just call setDebugListener(null).
   *
   * A debug listener is like any other listener. The only difference is that a
   * debug listener is "stealthy": its presence/absence does not trigger the
   * start/stop of the stream (or the producer inside the stream). This is
   * useful so you can inspect what is going on without changing the behavior
   * of the program. If you have an idle stream and you add a normal listener to
   * it, the stream will start executing. But if you set a debug listener on an
   * idle stream, it won't start executing (not until the first normal listener
   * is added).
   *
   * As the name indicates, we don't recommend using this method to build app
   * logic. In fact, in most cases the debug operator works just fine. Only use
   * this one if you know what you're doing.
   *
   * @param {Listener<T>} listener
   */
  setDebugListener(listener: Listener<T>) {
    if (!listener) {
      this._d = false;
      this._dl = NO as InternalListener<T>;
    } else {
      this._d = true;
      (listener as InternalListener<T> & Listener<T>)._n = listener.next;
      (listener as InternalListener<T> & Listener<T>)._e = listener.error;
      (listener as InternalListener<T> & Listener<T>)._c = listener.complete;
      this._dl = listener as InternalListener<T> & Listener<T>;
    }
  }
}

export class MemoryStream<T> extends Stream<T> {
  private _v: T;
  private _has: boolean = false;
  constructor(producer: InternalProducer<T>) {
    super(producer);
  }

  _n(x: T) {
    this._v = x;
    this._has = true;
    super._n(x);
  }

  _add(il: InternalListener<T>): void {
    const ta = this._target;
    if (ta !== NO) return ta._add(il);
    const a = this._ils;
    a.push(il);
    if (a.length > 1) {
      if (this._has) il._n(this._v);
      return;
    }
    if (this._stopID !== NO) {
      if (this._has) il._n(this._v);
      clearTimeout(this._stopID);
      this._stopID = NO;
    } else if (this._has) il._n(this._v); else {
      const p = this._prod;
      if (p !== NO) p._start(this);
    }
  }

  _stopNow() {
    this._has = false;
    super._stopNow();
  }

  _x(): void {
    this._has = false;
    super._x();
  }

  map<U>(project: (t: T) => U): MemoryStream<U> {
    return this._map(project) as MemoryStream<U>;
  }

  mapTo<U>(projectedValue: U): MemoryStream<U> {
    return super.mapTo(projectedValue) as MemoryStream<U>;
  }

  take(amount: number): MemoryStream<T> {
    return super.take(amount) as MemoryStream<T>;
  }

  endWhen(other: Stream<any>): MemoryStream<T> {
    return super.endWhen(other) as MemoryStream<T>;
  }

  replaceError(replace: (err: any) => Stream<T>): MemoryStream<T> {
    return super.replaceError(replace) as MemoryStream<T>;
  }

  remember(): MemoryStream<T> {
    return this;
  }

  debug(): MemoryStream<T>;
  debug(labelOrSpy: string): MemoryStream<T>;
  debug(labelOrSpy: (t: T) => any): MemoryStream<T>;
  debug(labelOrSpy?: string | ((t: T) => any) | undefined): MemoryStream<T> {
    return super.debug(labelOrSpy as any) as MemoryStream<T>;
  }
}

export default Stream;
