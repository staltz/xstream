import {Promise} from '~es6-promise/dist/es6-promise';

const empty = {};
function noop() {}

export interface InternalListener<T> {
  _n: (v: T) => void;
  _e: (err: any) => void;
  _c: () => void;
}

const emptyListener: InternalListener<any> = {
  _n: noop,
  _e: noop,
  _c: noop,
};

export interface InternalProducer<T> {
  _start: (listener: InternalListener<T>) => void;
  _stop: () => void;
}

export interface Operator<T, R> extends InternalProducer<R>, InternalListener<T> {
  _start: (out: Stream<R>) => void;
  _stop: () => void;
  _n: (v: T) => void;
  _e: (err: any) => void;
  _c: () => void;
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

// mutates the input
function internalizeProducer<T>(producer: Producer<T>) {
  (<InternalProducer<T>> (<any> producer))._start =
    function _start(il: InternalListener<T>) {
      (<Listener<T>> (<any> il)).next = il._n;
      (<Listener<T>> (<any> il)).error = il._e;
      (<Listener<T>> (<any> il)).complete = il._c;
      this.start(<Listener<T>> (<any> il));
    };
  (<InternalProducer<T>> (<any> producer))._stop = producer.stop;
}

function invoke(f: Function, args: Array<any>) {
  switch (args.length) {
  case 0: return f();
  case 1: return f(args[0]);
  case 2: return f(args[0], args[1]);
  case 3: return f(args[0], args[1], args[2]);
  case 4: return f(args[0], args[1], args[2], args[3]);
  case 5: return f(args[0], args[1], args[2], args[3], args[4]);
  default: return f.apply(void 0, args);
  }
}

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

class CombineListener<T> implements InternalListener<T> {
  constructor(private i: number,
              private prod: CombineProducer<T>) {
    prod.proxies.push(this);
  }

  _n(t: T): void {
    const prod = this.prod;
    const vals = prod.vals;
    prod.hasVal[this.i] = true;
    vals[this.i] = t;
    if (!prod.ready) {
      prod.up();
    }
    if (prod.ready) {
      try {
        prod.out._n(invoke(prod.project, vals));
      } catch (e) {
        prod.out._e(e);
      }
    }
  }

  _e(err: any): void {
    this.prod.out._e(err);
  }

  _c(): void {
    const prod = this.prod;
    if (--prod.ac === 0) {
      prod.out._c();
    }
  }
}

class CombineProducer<R> implements InternalProducer<R> {
  public out: InternalListener<R> = emptyListener;
  public ac: number; // ac is activeCount
  public proxies: Array<CombineListener<any>> = [];
  public ready: boolean = false;
  public hasVal: Array<boolean>;
  public vals: Array<any>;

  constructor(public project: CombineProjectFunction,
              public streams: Array<Stream<any>>) {
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

  _start(out: InternalListener<R>): void {
    this.out = out;
    const streams = this.streams;
    for (let i = streams.length - 1; i >= 0; i--) {
      streams[i]._add(new CombineListener(i, this));
    }
  }

  _stop(): void {
    const streams = this.streams;
    for (let i = streams.length - 1; i >= 0; i--) {
      streams[i]._remove(this.proxies[i]);
    }
    this.out = null;
    this.ac = streams.length;
    this.proxies = [];
    this.ready = false;
    this.vals = new Array(streams.length);
    this.hasVal = new Array(streams.length);
  }
}

class FromArrayProducer<T> implements InternalProducer<T> {
  constructor(public a: Array<T>) {
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

class FromPromiseProducer<T> implements InternalProducer<T> {
  public on: boolean = false;

  constructor(public p: Promise<T>) {
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
    ).then(null, (err: any) => {
      setTimeout(() => { throw err; });
    });
  }

  _stop(): void {
    this.on = false;
  }
}

class MergeProducer<T> implements InternalProducer<T>, InternalListener<T> {
  private out: InternalListener<T> = emptyListener;
  private ac: number; // ac is activeCount, starts initialized

  constructor(public streams: Array<Stream<T>>) {
    this.ac = streams.length;
  }

  _start(out: InternalListener<T>): void {
    this.out = out;
    const streams = this.streams;
    for (let i = streams.length - 1; i >= 0; i--) {
      streams[i]._add(this);
    }
  }

  _stop(): void {
    const streams = this.streams;
    for (let i = streams.length - 1; i >= 0; i--) {
      streams[i]._remove(this);
    }
    this.out = null;
    this.ac = streams.length;
  }

  _n(t: T) {
    this.out._n(t);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    if (--this.ac === 0) {
      this.out._c();
    }
  }
}

class PeriodicProducer implements InternalProducer<number> {
  private intervalID: any = -1;
  private i: number = 0;

  constructor(public period: number) {
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

class DebugOperator<T> implements Operator<T, T> {
  private out: Stream<T> = null;

  constructor(public spy: (t: T) => any = null,
              public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = null;
  }

  _n(t: T) {
    if (this.spy) {
      try {
        this.spy(t);
      } catch (e) {
        this.out._e(e);
      }
    } else {
      console.log(t);
    }
    this.out._n(t);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.out._c();
  }
}

class DropOperator<T> implements Operator<T, T> {
  private out: Stream<T> = null;
  private dropped: number = 0;

  constructor(public max: number,
              public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = null;
    this.dropped = 0;
  }

  _n(t: T) {
    if (this.dropped++ >= this.max) this.out._n(t);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.out._c();
  }
}

class OtherListener<T> implements InternalListener<any> {
  constructor(private out: Stream<T>,
              private op: EndWhenOperator<T>) {
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

class EndWhenOperator<T> implements Operator<T, T> {
  private out: Stream<T> = null;
  private oli: InternalListener<any> = emptyListener; // oli = other listener

  constructor(public o: Stream<any>, // o = other
              public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.o._add(this.oli = new OtherListener(out, this));
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.o._remove(this.oli);
    this.out = null;
    this.oli = null;
  }

  end(): void {
    this.out._c();
  }

  _n(t: T) {
    this.out._n(t);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.end();
  }
}

class FilterOperator<T> implements Operator<T, T> {
  private out: Stream<T> = null;

  constructor(public predicate: (t: T) => boolean,
              public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = null;
  }

  _n(t: T) {
    try {
      if (this.predicate(t)) this.out._n(t);
    } catch (e) {
      this.out._e(e);
    }
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.out._c();
  }
}

class FCInner<T> implements InternalListener<T> {
  constructor(private out: Stream<T>,
              private op: FlattenConcOperator<T>) {
  }

  _n(t: T) {
    this.out._n(t);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.op.less();
  }
}

export class FlattenConcOperator<T> implements Operator<Stream<T>, T> {
  private active: number = 1; // number of outers and inners that have not yet ended
  private out: Stream<T> = null;

  constructor(public ins: Stream<Stream<T>>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.active = 1;
    this.out = null;
  }

  less(): void {
    if (--this.active === 0) {
      this.out._c();
    }
  }

  _n(s: Stream<T>) {
    this.active++;
    s._add(new FCInner(this.out, this));
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.less();
  }
}

class FInner<T> implements InternalListener<T> {
  constructor(private out: Stream<T>,
              private op: FlattenOperator<T>) {
  }

  _n(t: T) {
    this.out._n(t);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.op.curr = null;
    this.op.less();
  }
}

export class FlattenOperator<T> implements Operator<Stream<T>, T> {
  public curr: Stream<T> = null; // Current inner Stream
  private inner: InternalListener<T> = null; // Current inner InternalListener
  private open: boolean = true;
  private out: Stream<T> = null;

  constructor(public ins: Stream<Stream<T>>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.curr = null;
    this.inner = null;
    this.open = true;
    this.out = null;
  }

  cut(): void {
    const {curr, inner} = this;
    if (curr && inner) {
      curr._remove(inner);
    }
  }

  less(): void {
    if (!this.open && !this.curr) {
      this.out._c();
    }
  }

  _n(s: Stream<T>) {
    this.cut();
    (this.curr = s)._add(this.inner = new FInner(this.out, this));
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.open = false;
    this.less();
  }
}

class FoldOperator<T, R> implements Operator<T, R> {
  private out: Stream<R> = null;
  private acc: R; // initialized as seed

  constructor(public f: (acc: R, t: T) => R,
              public seed: R,
              public ins: Stream<T>) {
    this.acc = seed;
  }

  _start(out: Stream<R>): void {
    this.out = out;
    out._n(this.acc);
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = null;
    this.acc = this.seed;
  }

  _n(t: T) {
    try {
      this.out._n(this.acc = this.f(this.acc, t));
    } catch (e) {
      this.out._e(e);
    }
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.out._c();
  }
}

class LastOperator<T> implements Operator<T, T> {
  private out: Stream<T> = null;
  private has: boolean = false;
  private val: T = <T> empty;

  constructor(public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = null;
    this.has = false;
    this.val = <T> empty;
  }

  _n(t: T) {
    this.has = true;
    this.val = t;
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    const out = this.out;
    if (this.has) {
      out._n(this.val);
      out._c();
    } else {
      out._e('TODO show proper error');
    }
  }
}

class MFCInner<T> implements InternalListener<T> {
  constructor(private out: Stream<T>,
              private op: MapFlattenConcOperator<T>) {
  }

  _n(t: T) {
    this.out._n(t);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.op.less();
  }
}

class MapFlattenConcOperator<T> implements InternalProducer<T>, InternalListener<T> {
  private active: number = 1; // number of outers and inners that have not yet ended
  private out: Stream<T> = null;

  constructor(public mapOp: MapOperator<T, Stream<T>>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.mapOp.ins._add(this);
  }

  _stop(): void {
    this.mapOp.ins._remove(this);
    this.active = 1;
    this.out = null;
  }

  less(): void {
    if (--this.active === 0) {
      this.out._c();
    }
  }

  _n(v: T) {
    this.active++;
    try {
      this.mapOp.project(v)._add(new MFCInner(this.out, this));
    } catch (e) {
      this.out._e(e);
    }
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.less();
  }
}

class MFInner<T> implements InternalListener<T> {
  constructor(private out: Stream<T>,
              private op: MapFlattenOperator<T>) {
  }

  _n(t: T) {
    this.out._n(t);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.op.curr = null;
    this.op.less();
  }
}

class MapFlattenOperator<T> implements InternalProducer<T>, InternalListener<T> {
  public curr: Stream<T> = null; // Current inner Stream
  private inner: InternalListener<T> = null; // Current inner InternalListener
  private open: boolean = true;
  private out: Stream<T> = null;

  constructor(public mapOp: MapOperator<T, Stream<T>>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.mapOp.ins._add(this);
  }

  _stop(): void {
    this.mapOp.ins._remove(this);
    this.curr = null;
    this.inner = null;
    this.open = true;
    this.out = null;
  }

  cut(): void {
    const {curr, inner} = this;
    if (curr && inner) {
      curr._remove(inner);
    }
  }

  less(): void {
    if (!this.open && !this.curr) {
      this.out._c();
    }
  }

  _n(v: T) {
    this.cut();
    try {
      (this.curr = this.mapOp.project(v))._add(this.inner = new MFInner(this.out, this));
    } catch (e) {
      this.out._e(e);
    }
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.open = false;
    this.less();
  }
}

class MapOperator<T, R> implements Operator<T, R> {
  private out: Stream<R> = null;

  constructor(public project: (t: T) => R,
              public ins: Stream<T>) {
  }

  _start(out: Stream<R>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = null;
  }

  _n(t: T) {
    try {
      this.out._n(this.project(t));
    } catch (e) {
      this.out._e(e);
    }
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.out._c();
  }
}

class MapToOperator<T, R> implements Operator<T, R> {
  private out: Stream<R> = null;

  constructor(public val: R,
              public ins: Stream<T>) {
  }

  _start(out: Stream<R>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = null;
  }

  _n(t: T) {
    this.out._n(this.val);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.out._c();
  }
}

class ReplaceErrorOperator<T> implements Operator<T, T> {
  private out: Stream<T> = <Stream<T>> empty;

  constructor(public fn: (err: any) => Stream<T>,
              public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = null;
  }

  _n(t: T) {
    this.out._n(t);
  }

  _e(err: any) {
    try {
      this.ins._remove(this);
      (this.ins = this.fn(err))._add(this);
    } catch (e) {
      this.out._e(e);
    }
  }

  _c() {
    this.out._c();
  }
}

class StartWithOperator<T> implements InternalProducer<T> {
  private out: InternalListener<T> = emptyListener;

  constructor(public ins: Stream<T>,
              public value: T) {
  }

  _start(out: InternalListener<T>): void {
    this.out = out;
    this.out._n(this.value);
    this.ins._add(out);
  }

  _stop(): void {
    this.ins._remove(this.out);
    this.out = null;
  }
}

class TakeOperator<T> implements Operator<T, T> {
  private out: Stream<T> = null;
  private taken: number = 0;

  constructor(public max: number,
              public ins: Stream<T>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    this.ins._add(this);
  }

  _stop(): void {
    this.ins._remove(this);
    this.out = null;
    this.taken = 0;
  }

  _n(t: T) {
    const out = this.out;
    if (this.taken++ < this.max - 1) {
      out._n(t);
    } else {
      out._n(t);
      out._c();
      this._stop();
    }
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.out._c();
  }
}

export class Stream<T> implements InternalListener<T> {
  private _ils: Array<InternalListener<T>>; // 'ils' = Internal listeners
  private _stopID: any = empty;
  private _prod: InternalProducer<T>;

  constructor(producer: InternalProducer<T>) {
    this._prod = producer;
    this._ils = [];
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
    this._x();
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
    this._x();
  }

  _x(): void { // tear down logic, after error or complete
    if (this._ils.length === 0) return;
    if (this._prod) this._prod._stop();
    this._ils = [];
  }

  /**
   * Adds a Listener to the Stream.
   *
   * @param {Listener<T>} listener
   */
  addListener(listener: Listener<T>): void {
    (<InternalListener<T>> (<any> listener))._n = listener.next;
    (<InternalListener<T>> (<any> listener))._e = listener.error;
    (<InternalListener<T>> (<any> listener))._c = listener.complete;
    this._add(<InternalListener<T>> (<any> listener));
  }

  /**
   * Removes a Listener from the Stream, assuming the Listener was added to it.
   *
   * @param {Listener<T>} listener
   */
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
      internalizeProducer(producer); // mutates the input
    }
    return new Stream(<InternalProducer<T>> (<any> producer));
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
    return new MemoryStream<T>(<InternalProducer<T>> (<any> producer));
  }

  /**
   * Creates a Stream that does nothing when started. It never emits any event.
   *
   * @factory true
   * @return {Stream}
   */
  static never(): Stream<any> {
    return new Stream<any>({_start: noop, _stop: noop});
  }

  static empty(): Stream<any> {
    return new Stream<any>({
      _start(il: InternalListener<any>) { il._c(); },
      _stop: noop,
    });
  }

  static throw(err: any): Stream<any> {
    return new Stream<any>({
      _start(il: InternalListener<any>) { il._e(err); },
      _stop: noop,
    });
  }

  static of<T>(...items: Array<T>): Stream<T> {
    return Stream.fromArray(items);
  }

  static fromArray<T>(array: Array<T>): Stream<T> {
    return new Stream<T>(new FromArrayProducer(array));
  }

  static fromPromise<T>(promise: Promise<T>): Stream<T> {
    return new Stream<T>(new FromPromiseProducer(promise));
  }

  static periodic(period: number): Stream<number> {
    return new Stream<number>(new PeriodicProducer(period));
  }

  static merge<T>(...streams: Array<Stream<T>>): Stream<T> {
    return new Stream<T>(new MergeProducer(streams));
  }

  static combine: CombineFactorySignature =
    function combine<R>(project: CombineProjectFunction,
                        ...streams: Array<Stream<any>>): Stream<R> {
      return new Stream<R>(new CombineProducer<R>(project, streams));
    };

  /**
   * Transform each event from the input Stream through a `project` function, to
   * get a Stream that emits those transformed events.
   *
   * Marble diagram:
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
    return new Stream<U>(new MapOperator(project, this));
  }

  /**
   * It's like `map`, but transforms each input event to always the same
   * constant value on the output Stream.
   *
   * Marble diagram:
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

  replaceError(replace: (err: any) => Stream<T>): Stream<T> {
    return new Stream<T>(new ReplaceErrorOperator(replace, this));
  }

  flatten<R, T extends Stream<R>>(): T {
    return <T> new Stream<R>(this._prod instanceof MapOperator ?
      new MapFlattenOperator(<MapOperator<R, Stream<R>>> <any> this._prod) :
      new FlattenOperator(<Stream<Stream<R>>> <any> this)
    );
  }

  flattenConcurrently<R, T extends Stream<R>>(): T {
    return <T> new Stream<R>(this._prod instanceof MapOperator ?
      new MapFlattenConcOperator(<MapOperator<R, Stream<R>>> <any> this._prod) :
      new FlattenConcOperator(<Stream<Stream<R>>> <any> this)
    );
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

export default Stream;
