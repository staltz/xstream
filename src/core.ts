import {Promise} from 'es6-promise';

const empty = {};
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

function compose2<T, U>(f1: (t: T) => any, f2: (t: T) => any): (t: T) => any {
  return function composedFn(arg: T): any {
    return f1(f2(arg));
  };
}

function and<T>(f1: (t: T) => boolean, f2: (t: T) => boolean): (t: T) => boolean {
  return function andFn(t: T): boolean {
    return f1(t) && f2(t);
  };
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

export class FromArrayProducer<T> implements InternalProducer<T> {
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

export class FromPromiseProducer<T> implements InternalProducer<T> {
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

export class MergeProducer<T> implements InternalProducer<T>, InternalListener<T> {
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

export class PeriodicProducer implements InternalProducer<number> {
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

export class DebugOperator<T> implements Operator<T, T> {
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

export class DropOperator<T> implements Operator<T, T> {
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

export class EndWhenOperator<T> implements Operator<T, T> {
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

export class FilterOperator<T> implements Operator<T, T> {
  private out: Stream<T> = null;

  constructor(public passes: (t: T) => boolean,
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
      if (this.passes(t)) this.out._n(t);
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

export class FoldOperator<T, R> implements Operator<T, R> {
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

export class LastOperator<T> implements Operator<T, T> {
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

export class MapFlattenConcOperator<T> implements InternalProducer<T>, InternalListener<T> {
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

export class MapFlattenOperator<T> implements InternalProducer<T>, InternalListener<T> {
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

export class MapOperator<T, R> implements Operator<T, R> {
  protected out: Stream<R> = null;

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

export class FilterMapOperator<T, R> extends MapOperator<T, R> {
  constructor(public passes: (t: T) => boolean,
              project: (t: T) => R,
              ins: Stream<T>) {
    super(project, ins);
  }

  _n(v: T) {
    if (this.passes(v)) {
      super._n(v);
    };
  }
}

export class MapToOperator<T, R> implements Operator<T, R> {
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

export class ReplaceErrorOperator<T> implements Operator<T, T> {
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

export class StartWithOperator<T> implements InternalProducer<T> {
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

export class TakeOperator<T> implements Operator<T, T> {
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
    if (!out) return;
    if (this.taken++ < this.max - 1) {
      out._n(t);
    } else {
      out._n(t);
      out._c();
      this._stop();
    }
  }

  _e(err: any) {
    const out = this.out;
    if (!out) return;
    out._e(err);
  }

  _c() {
    const out = this.out;
    if (!out) return;
    out._c();
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
    const a = this._ils;
    const L = a.length;
    if (L == 1) a[0]._n(t); else {
      const b = copy(a);
      for (let i = 0; i < L; i++) b[i]._n(t);
    }
  }

  _e(err: any): void {
    const a = this._ils;
    const L = a.length;
    if (L == 1) a[0]._e(err); else {
      const b = copy(a);
      for (let i = 0; i < L; i++) b[i]._e(err);
    }
    this._x();
  }

  _c(): void {
    const a = this._ils;
    const L = a.length;
    if (L == 1) a[0]._c(); else {
      const b = copy(a);
      for (let i = 0; i < L; i++) b[i]._c();
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
    if (typeof listener.next !== 'function'
    || typeof listener.error !== 'function'
    || typeof listener.complete !== 'function') {
      throw new Error('stream.addListener() requires all three next, error, ' +
      'and complete functions.');
    }
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
    const a = this._ils;
    a.push(il);
    if (a.length === 1) {
      if (this._stopID !== empty) {
        clearTimeout(this._stopID);
        this._stopID = empty;
      }
      const p = this._prod;
      if (p) p._start(this);
    }
  }

  _remove(il: InternalListener<T>): void {
    const a = this._ils;
    const i = a.indexOf(il);
    if (i > -1) {
      a.splice(i, 1);
      const p = this._prod;
      if (p && a.length <= 0) {
        this._stopID = setTimeout(() => p._stop());
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
      if (typeof producer.start !== 'function'
      || typeof producer.stop !== 'function') {
        throw new Error('producer requires both start and stop functions');
      }
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
    return Stream.fromArray(items);
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
    return new Stream<T>(new FromArrayProducer(array));
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
    return new Stream<T>(new FromPromiseProducer(promise));
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
   * imitates each of the argument streams, in parallel.
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
  static merge<T>(...streams: Array<Stream<T>>): Stream<T> {
    return new Stream<T>(new MergeProducer(streams));
  }

  /**
   * Combines multiple streams together to return a stream whose events are
   * calculated from the latest events of each of the input streams.
   *
   * *combine* remembers the most recent event from each of the input streams.
   * When any of the input streams emits an event, that event together with all
   * the other saved events are combined in the `project` function which should
   * return a value. That value will be emitted on the output stream. It's
   * essentially a way of mixing the events from multiple streams according to a
   * formula.
   *
   * Marble diagram:
   *
   * ```text
   * --1----2-----3--------4---
   * ----a-----b-----c--d------
   *   combine((x,y) => x+y)
   * ----1a-2a-2b-3b-3c-3d-4d--
   * ```
   *
   * @factory true
   * @param {Function} project A function of type `(x: T1, y: T2) => R` or
   * similar that takes the most recent events `x` and `y` from the input
   * streams and returns a value. The output stream will emit that value. The
   * number of arguments for this function should match the number of input
   * streams.
   * @param {Stream} stream1 A stream to combine together with other streams.
   * @param {Stream} stream2 A stream to combine together with other streams.
   * Two or more streams may be given as arguments.
   * @return {Stream}
   */
  static combine: CombineFactorySignature =
    function combine<R>(project: CombineProjectFunction,
                        ...streams: Array<Stream<any>>): Stream<R> {
      return new Stream<R>(new CombineProducer<R>(project, streams));
    };

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
    const p = this._prod;
    if (p instanceof FilterOperator) {
      return new Stream<U>(new FilterMapOperator(
        (<FilterOperator<T>> p).passes,
        project,
        (<FilterOperator<T>> p).ins
      ));
    }
    if (p instanceof FilterMapOperator) {
      return new Stream<U>(new FilterMapOperator(
        (<FilterMapOperator<T, T>> p).passes,
        compose2(project, (<FilterMapOperator<T, T>> p).project),
        (<FilterMapOperator<T, T>> p).ins
      ));
    }
    if (p instanceof MapOperator) {
      return new Stream<U>(new MapOperator(
        compose2(project, (<MapOperator<T, T>> p).project),
        (<MapOperator<T, T>> p).ins
      ));
    }
    return new Stream<U>(new MapOperator(project, this));
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
    return new Stream<U>(new MapToOperator(projectedValue, this));
  }

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
      return new Stream<T>(new FilterOperator(
        and(passes, (<FilterOperator<T>> p).passes),
        (<FilterOperator<T>> p).ins
      ));
    }
    return new Stream<T>(new FilterOperator(passes, this));
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
    return new Stream<T>(new TakeOperator(amount, this));
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
    return new Stream<T>(new DropOperator(amount, this));
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
    return new Stream<T>(new LastOperator(this));
  }

  /**
   * Prepends the given `initial` value to the sequence of events emitted by the
   * input stream.
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
   * @return {Stream}
   */
  startWith(initial: T): Stream<T> {
    return new Stream<T>(new StartWithOperator(this, initial));
  }

  /**
   * Uses another stream to determine when to complete the current stream.
   *
   * When the given `other` stream emits an event or completes, the output
   * stream will complete. Before that happens, the output stream will imitate
   * whatever happens on the input stream.
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
    return new Stream<T>(new EndWhenOperator(other, this));
  }

  /**
   * "Folds" the stream onto itself.
   *
   * Combines events from the past throughout
   * the entire execution of the input stream, allowing you to accumulate them
   * together. It's essentially like `Array.prototype.reduce`.
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
   * @return {Stream}
   */
  fold<R>(accumulate: (acc: R, t: T) => R, seed: R): Stream<R> {
    return new Stream<R>(new FoldOperator(accumulate, seed, this));
  }

  /**
   * Replaces an error with another stream.
   *
   * When (and if) an error happens on the input stream, instead of forwarding
   * that error to the output stream, *replaceError* will call the `replace`
   * function which returns the stream that the output stream will imitate. And,
   * in case that new stream also emits an error, `replace` will be called again
   * to get another stream to start imitating.
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
   * the error that occured on the input stream or on the previous replacement
   * stream and returns a new stream. The output stream will imitate the stream
   * that this function returns.
   * @return {Stream}
   */
  replaceError(replace: (err: any) => Stream<T>): Stream<T> {
    return new Stream<T>(new ReplaceErrorOperator(replace, this));
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
    return <T> <any> new Stream<R>(
      p instanceof MapOperator || p instanceof FilterMapOperator ?
        new MapFlattenOperator(<MapOperator<R, Stream<R>>> <any> p) :
        new FlattenOperator(<Stream<Stream<R>>> <any> this)
    );
  }

  /**
   * Flattens a "stream of streams", handling multiple concurrent nested streams
   * simultaneously.
   *
   * If the input stream is a stream that emits streams, then this operator will
   * return an output stream which is a flat stream: emits regular events. The
   * flattening happens concurrently. It works like this: when the input stream
   * emits a nested stream, *flattenConcurrently* will start imitating that
   * nested one. When the next nested stream is emitted on the input stream,
   * *flattenConcurrently* will also imitate that new one, but will continue to
   * imitate the previous nested streams as well.
   *
   * Marble diagram:
   *
   * ```text
   * --+--------+---------------
   *   \        \
   *    \       ----1----2---3--
   *    --a--b----c----d--------
   *     flattenConcurrently
   * -----a--b----c-1--d-2---3--
   * ```
   *
   * @return {Stream}
   */
  flattenConcurrently<R>(): T {
    const p = this._prod;
    return <T> <any> new Stream<R>(
      p instanceof MapOperator || p instanceof FilterMapOperator ?
        new MapFlattenConcOperator(<MapOperator<R, Stream<R>>> <any> p) :
        new FlattenConcOperator(<Stream<Stream<R>>> <any> this)
    );
  }

  /**
   * Blends two streams together, emitting events from both.
   *
   * *merge* takes an `other` stream and returns an output stream that imitates
   * both the input stream and the `other` stream.
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
   * @param {Stream} other Another stream to merge together with the input
   * stream.
   * @return {Stream}
   */
  merge(other: Stream<T>): Stream<T> {
    return Stream.merge(this, other);
  }

  /**
   * Combines multiple streams with the input stream to return a stream whose
   * events are calculated from the latest events of each of its input streams.
   *
   * *combine* remembers the most recent event from each of the input streams.
   * When any of the input streams emits an event, that event together with all
   * the other saved events are combined in the `project` function which should
   * return a value. That value will be emitted on the output stream. It's
   * essentially a way of mixing the events from multiple streams according to a
   * formula.
   *
   * Marble diagram:
   *
   * ```text
   * --1----2-----3--------4---
   * ----a-----b-----c--d------
   *   combine((x,y) => x+y)
   * ----1a-2a-2b-3b-3c-3d-4d--
   * ```
   *
   * @param {Function} project A function of type `(x: T1, y: T2) => R` or
   * similar that takes the most recent events `x` and `y` from the input
   * streams and returns a value. The output stream will emit that value. The
   * number of arguments for this function should match the number of input
   * streams.
   * @param {Stream} other Another stream to combine together with the input
   * stream. There may be more of these arguments.
   * @return {Stream}
   */
  combine: CombineInstanceSignature<T> =
    function combine<R>(project: CombineProjectFunction,
                        ...streams: Array<Stream<any>>): Stream<R> {
      streams.unshift(this);
      return Stream.combine(project, ...streams);
    };

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
  compose(operator: (stream: Stream<T>) => Stream<any>): Stream<any> {
    return operator(this);
  }

  /**
   * Returns an output stream that imitates the input stream, but also remembers
   * the most recent event that happens on the input stream, so that a newly
   * added listener will immediately receive that memorised event.
   *
   * @return {Stream}
   */
  remember(): Stream<T> {
    return new MemoryStream<T>({
      _start: (il: InternalListener<T>) => { this._prod._start(il); },
      _stop: () => { this._prod._stop(); },
    });
  }

  /**
   * Changes this current stream to imitate the `other` given stream.
   *
   * The *imitate* method returns nothing. Instead, it changes the behavior of
   * the current stream, making it re-emit whatever events are emitted by the
   * given `other` stream.

   * @param {Stream} other The stream to imitate on the current one.
   */
  imitate(other: Stream<T>): void {
    other._add(this);
  }

  /**
   * Returns an output stream that identically imitates the input stream, but
   * also runs a `spy` function fo each event, to help you debug your app.
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
   * @param {function} spy A function that takes an event as argument, and
   * returns nothing.
   * @return {Stream}
   */
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
