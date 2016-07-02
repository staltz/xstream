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

export const emptyIL: InternalListener<any> = {
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

export class MergeProducer<T> implements Aggregator<T, T>, InternalListener<T> {
  public type: string;
  public out: Stream<T>;
  public insArr: Array<Stream<T>>;
  private ac: number; // ac is activeCount, starts initialized

  constructor(s: Array<Stream<T>>) {
    const q = this;
    q.type = 'merge';
    q.out = null;
    q.insArr = s;
    q.ac = s.length;
  }

  _start(out: Stream<T>): void {
    const q = this;
    q.out = out;
    const s = q.insArr;
    const L = s.length;
    for (let i = 0; i < L; i++) {
      s[i]._add(q);
    }
  }

  _stop(): void {
    const q = this;
    const s = q.insArr;
    const L = s.length;
    for (let i = 0; i < L; i++) {
      s[i]._remove(q);
    }
    q.out = null;
    q.ac = L;
  }

  _n(t: T) {
    const u = this.out;
    if (!u) return;
    u._n(t);
  }

  _e(err: any) {
    const u = this.out;
    if (!u) return;
    u._e(err);
  }

  _c() {
    if (--this.ac === 0) {
      const u = this.out;
      if (!u) return;
      u._c();
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

export class CombineListener<T> implements InternalListener<T>, OutSender<Array<T>> {
  private i: number;
  public out: Stream<Array<T>>;
  private p: CombineProducer<T>;

  constructor(i: number, u: Stream<Array<T>>, p: CombineProducer<T>) {
    const q = this;
    q.i = i;
    q.out = u;
    q.p = p;
    p.ils.push(q);
  }

  _n(t: T): void {
    const q = this;
    const p = q.p, out = q.out;
    if (!out) return;
    if (p.up(t, q.i)) {
      out._n(p.vals);
    }
  }

  _e(err: any): void {
    const out = this.out;
    if (!out) return;
    out._e(err);
  }

  _c(): void {
    const p = this.p;
    if (!p.out) return;
    if (--p.Nc === 0) {
      p.out._c();
    }
  }
}

export class CombineProducer<R> implements Aggregator<any, Array<R>> {
  public type: string;
  public out: Stream<Array<R>>;
  public ils: Array<CombineListener<any>>;
  public insArr: Array<Stream<any>>;
  public Nc: number; // *N*umber of streams still to send *c*omplete
  public Nn: number; // *N*umber of streams still to send *n*ext
  public vals: Array<R>;

  constructor(s: Array<Stream<any>>) {
    const q = this;
    q.type = 'combine';
    q.out = null;
    q.ils = [];
    q.insArr = s;
    const n = q.Nc = q.Nn = s.length;
    const vals = q.vals = new Array(n);
    for (let i = 0; i < n; i++) {
      vals[i] = empty;
    }
  }

  up(t: any, i: number): boolean {
    const q = this;
    const v = q.vals[i];
    const Nn = !q.Nn ? 0 : v === empty ? --q.Nn : q.Nn;
    q.vals[i] = t;
    return Nn === 0;
  }

  _start(out: Stream<Array<R>>): void {
    const q = this;
    q.out = out;
    const s = q.insArr;
    const n = s.length;
    if (n === 0) {
      out._n([]);
      out._c();
    } else {
      for (let i = 0; i < n; i++) {
        s[i]._add(new CombineListener(i, out, q));
      }
    }
  }

  _stop(): void {
    const q = this;
    const s = q.insArr;
    const n = q.Nc = q.Nn = s.length;
    const vals = q.vals = new Array(n);
    for (let i = 0; i < n; i++) {
      s[i]._remove(q.ils[i]);
      vals[i] = empty;
    }
    q.out = null;
    q.ils = [];
  }
}

export class FromArrayProducer<T> implements InternalProducer<T> {
  public type: string;
  public a: Array<T>;

  constructor(a: Array<T>) {
    this.type = 'fromArray';
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
  public type: string;
  public on: boolean;
  public p: Promise<T>;

  constructor(p: Promise<T>) {
    const q = this;
    q.type = 'fromPromise';
    q.on = false;
    q.p = p;
  }

  _start(out: InternalListener<T>): void {
    const q = this;
    q.on = true;
    q.p.then(
      (v: T) => {
        if (q.on) {
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

export class PeriodicProducer implements InternalProducer<number> {
  public type: string;
  private id: any; // interval id when registering through setInterval()
  private i: number;
  public period: number;

  constructor(p: number) {
    const q = this;
    q.type = 'periodic';
    q.id = -1;
    q.i = 0;
    q.period = p;
  }

  _start(stream: InternalListener<number>): void {
    const q = this;
    function f() { stream._n(q.i++); }
    q.id = setInterval(f, q.period);
  }

  _stop(): void {
    const q = this;
    if (q.id !== -1) clearInterval(q.id);
    q.id = -1;
    q.i = 0;
  }
}

export class DebugOperator<T> implements Operator<T, T> {
  public type: string;
  public out: Stream<T>;
  private s: (t: T) => any; // spy
  private l: string; // label
  public ins: Stream<T>;

  constructor(arg: string | ((t: T) => any), s: Stream<T>) {
    const q = this;
    q.type = 'debug';
    q.out = null;
    q.s = null;
    q.l = null;
    q.ins = s;
    if (typeof arg === 'string') {
      q.l = arg;
    } else {
      q.s = arg;
    }
  }

  _start(out: Stream<T>): void {
    const q = this;
    q.out = out;
    q.ins._add(q);
  }

  _stop(): void {
    const q = this;
    q.ins._remove(q);
    q.out = null;
  }

  _n(t: T) {
    const q = this;
    const u = q.out;
    if (!u) return;
    const s = q.s, l = q.l;
    if (s) {
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
    if (!u) return;
    u._e(err);
  }

  _c() {
    const u = this.out;
    if (!u) return;
    u._c();
  }
}

export class DropOperator<T> implements Operator<T, T> {
  public type: string;
  public out: Stream<T>;
  private dropped: number;
  public max: number;
  public ins: Stream<T>;

  constructor(m: number, s: Stream<T>) {
    const q = this;
    q.type = 'drop';
    q.out = null;
    q.dropped = 0;
    q.max = m;
    q.ins = s;
  }

  _start(out: Stream<T>): void {
    const q = this;
    q.out = out;
    q.ins._add(q);
  }

  _stop(): void {
    const q = this;
    q.ins._remove(q);
    q.out = null;
    q.dropped = 0;
  }

  _n(t: T) {
    const q = this;
    const u = q.out;
    if (!u) return;
    if (q.dropped++ >= q.max) u._n(t);
  }

  _e(err: any) {
    const u = this.out;
    if (!u) return;
    u._e(err);
  }

  _c() {
    const u = this.out;
    if (!u) return;
    u._c();
  }
}

class OtherIL<T> implements InternalListener<any> {
  private out: Stream<T>;
  private op: EndWhenOperator<T>;

  constructor(u: Stream<T>, o: EndWhenOperator<T>) {
    this.out = u;
    this.op = o;
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
  public type: string;
  public out: Stream<T>;
  public o: Stream<any>; // o = other stream
  public ins: Stream<T>;
  private oil: InternalListener<any>; // oil = other InternalListener

  constructor(o: Stream<any>, s: Stream<T>) {
    const q = this;
    q.type = 'endWhen';
    q.out = null;
    q.o = o;
    q.ins = s;
    q.oil = emptyIL;
  }

  _start(out: Stream<T>): void {
    const q = this;
    q.out = out;
    q.o._add(q.oil = new OtherIL(out, q));
    q.ins._add(q);
  }

  _stop(): void {
    const q = this;
    q.ins._remove(q);
    q.o._remove(q.oil);
    q.out = null;
    q.oil = null;
  }

  end(): void {
    const u = this.out;
    if (!u) return;
    u._c();
  }

  _n(t: T) {
    const u = this.out;
    if (!u) return;
    u._n(t);
  }

  _e(err: any) {
    const u = this.out;
    if (!u) return;
    u._e(err);
  }

  _c() {
    this.end();
  }
}

export class FilterOperator<T> implements Operator<T, T> {
  public type: string;
  public out: Stream<T>;
  public passes: (t: T) => boolean;
  public ins: Stream<T>;

  constructor(p: (t: T) => boolean, s: Stream<T>) {
    const q = this;
    q.type = 'filter';
    q.out = null;
    q.passes = p;
    q.ins = s;
  }

  _start(out: Stream<T>): void {
    const q = this;
    q.out = out;
    q.ins._add(q);
  }

  _stop(): void {
    const q = this;
    q.ins._remove(q);
    q.out = null;
  }

  _n(t: T) {
    const u = this.out;
    if (!u) return;
    try {
      if (this.passes(t)) u._n(t);
    } catch (e) {
      u._e(e);
    }
  }

  _e(err: any) {
    const u = this.out;
    if (!u) return;
    u._e(err);
  }

  _c() {
    const u = this.out;
    if (!u) return;
    u._c();
  }
}

class FlattenListener<T> implements InternalListener<T> {
  private out: Stream<T>;
  private op: FlattenOperator<T>;

  constructor(u: Stream<T>, o: FlattenOperator<T>) {
    this.out = u;
    this.op = o;
  }

  _n(t: T) {
    this.out._n(t);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.op.inner = null;
    this.op.less();
  }
}

export class FlattenOperator<T> implements Operator<Stream<T>, T> {
  public type: string;
  public inner: Stream<T>; // Current inner Stream
  private il: InternalListener<T>; // Current inner InternalListener
  private open: boolean;
  public out: Stream<T>;
  public ins: Stream<Stream<T>>;

  constructor(s: Stream<Stream<T>>) {
    const q = this;
    q.type = 'flatten';
    q.inner = null;
    q.il = null;
    q.open = true;
    q.out = null;
    q.ins = s;
  }

  _start(out: Stream<T>): void {
    const q = this;
    q.out = out;
    q.ins._add(q);
  }

  _stop(): void {
    const q = this;
    q.ins._remove(q);
    q.inner = null;
    q.il = null;
    q.open = true;
    q.out = null;
  }

  less(): void {
    const q = this;
    const u = q.out;
    if (!u) return;
    if (!q.open && !q.inner) u._c();
  }

  _n(s: Stream<T>) {
    const q = this;
    const u = q.out;
    if (!u) return;
    const {inner, il} = q;
    if (inner && il) inner._remove(il);
    (q.inner = s)._add(q.il = new FlattenListener(u, q));
  }

  _e(err: any) {
    const u = this.out;
    if (!u) return;
    u._e(err);
  }

  _c() {
    this.open = false;
    this.less();
  }
}

export class FoldOperator<T, R> implements Operator<T, R> {
  public type: string;
  public out: Stream<R>;
  private acc: R;
  public f: (acc: R, t: T) => R;
  public seed: R;
  public ins: Stream<T>;

  constructor(f: (acc: R, t: T) => R, e: R, s: Stream<T>) {
    const q = this;
    q.type = 'fold';
    q.out = null;
    q.f = f;
    q.seed = e;
    q.acc = e;
    q.ins = s;
  }

  _start(out: Stream<R>): void {
    const q = this;
    q.out = out;
    out._n(q.acc);
    q.ins._add(q);
  }

  _stop(): void {
    const q = this;
    q.ins._remove(q);
    q.out = null;
    q.acc = q.seed;
  }

  _n(t: T) {
    const q = this;
    const u = q.out;
    if (!u) return;
    try {
      u._n(q.acc = q.f(q.acc, t));
    } catch (e) {
      u._e(e);
    }
  }

  _e(err: any) {
    const u = this.out;
    if (!u) return;
    u._e(err);
  }

  _c() {
    const u = this.out;
    if (!u) return;
    u._c();
  }
}

export class LastOperator<T> implements Operator<T, T> {
  public type: string;
  public out: Stream<T>;
  private has: boolean;
  private val: T;
  public ins: Stream<T>;

  constructor(s: Stream<T>) {
    const q = this;
    q.type = 'last';
    q.out = null;
    q.has = false;
    q.val = <T> empty;
    q.ins = s;
  }

  _start(out: Stream<T>): void {
    const q = this;
    q.out = out;
    q.ins._add(q);
  }

  _stop(): void {
    const q = this;
    q.ins._remove(q);
    q.out = null;
    q.has = false;
    q.val = <T> empty;
  }

  _n(t: T) {
    this.has = true;
    this.val = t;
  }

  _e(err: any) {
    const u = this.out;
    if (!u) return;
    u._e(err);
  }

  _c() {
    const q = this;
    const u = q.out;
    if (!u) return;
    if (q.has) {
      u._n(q.val);
      u._c();
    } else {
      u._e('TODO show proper error');
    }
  }
}

class MapFlattenInner<R> implements InternalListener<R> {
  private out: Stream<R>;
  private op: MapFlattenOperator<any, R>;

  constructor(u: Stream<R>, o: MapFlattenOperator<any, R>) {
    this.out = u;
    this.op = o;
  }

  _n(r: R) {
    this.out._n(r);
  }

  _e(err: any) {
    this.out._e(err);
  }

  _c() {
    this.op.inner = null;
    this.op.less();
  }
}

export class MapFlattenOperator<T, R> implements Operator<T, R> {
  public type: string;
  public ins: Stream<T>;
  public inner: Stream<R>; // Current inner Stream
  private il: InternalListener<R>; // Current inner InternalListener
  private open: boolean;
  public out: Stream<R>;
  public mapOp: MapOperator<T, Stream<R>>;

  constructor(m: MapOperator<T, Stream<R>>) {
    const q = this;
    q.type = `${m.type}+flatten`;
    q.ins = m.ins;
    q.inner = null;
    q.il = null;
    q.open = true;
    q.out = null;
    q.mapOp = m;
  }

  _start(out: Stream<R>): void {
    const q = this;
    q.out = out;
    q.mapOp.ins._add(q);
  }

  _stop(): void {
    const q = this;
    q.mapOp.ins._remove(q);
    q.inner = null;
    q.il = null;
    q.open = true;
    q.out = null;
  }

  less(): void {
    const q = this;
    if (!q.open && !q.inner) {
      const u = q.out;
      if (!u) return;
      u._c();
    }
  }

  _n(v: T) {
    const q = this;
    const u = q.out;
    if (!u) return;
    const {inner, il} = q;
    if (inner && il) inner._remove(il);
    try {
      (q.inner = q.mapOp.project(v))._add(
        q.il = new MapFlattenInner(u, q)
      );
    } catch (e) {
      u._e(e);
    }
  }

  _e(err: any) {
    const u = this.out;
    if (!u) return;
    u._e(err);
  }

  _c() {
    this.open = false;
    this.less();
  }
}

export class MapOperator<T, R> implements Operator<T, R> {
  public type: string;
  public out: Stream<R>;
  public project: (t: T) => R;
  public ins: Stream<T>;

  constructor(p: (t: T) => R, s: Stream<T>) {
    const q = this;
    q.type = 'map';
    q.out = null;
    q.project = p;
    q.ins = s;
  }

  _start(out: Stream<R>): void {
    const q = this;
    q.out = out;
    q.ins._add(q);
  }

  _stop(): void {
    const q = this;
    q.ins._remove(q);
    q.out = null;
  }

  _n(t: T) {
    const u = this.out;
    if (!u) return;
    try {
      u._n(this.project(t));
    } catch (e) {
      u._e(e);
    }
  }

  _e(err: any) {
    const u = this.out;
    if (!u) return;
    u._e(err);
  }

  _c() {
    const u = this.out;
    if (!u) return;
    u._c();
  }
}

export class FilterMapOperator<T, R> extends MapOperator<T, R> {
  public type: string;
  public passes: (t: T) => boolean;

  constructor(p: (t: T) => boolean, project: (t: T) => R, ins: Stream<T>) {
    super(project, ins);
    this.type = 'filter+map';
    this.passes = p;
  }

  _n(v: T) {
    if (this.passes(v)) {
      super._n(v);
    };
  }
}

export class ReplaceErrorOperator<T> implements Operator<T, T> {
  public type: string;
  public out: Stream<T>;
  public fn: (err: any) => Stream<T>;
  public ins: Stream<T>;

  constructor(f: (err: any) => Stream<T>, s: Stream<T>) {
    const q = this;
    q.type = 'replaceError';
    q.out = <Stream<T>> empty;
    q.fn = f;
    q.ins = s;
  }

  _start(out: Stream<T>): void {
    const q = this;
    q.out = out;
    q.ins._add(q);
  }

  _stop(): void {
    const q = this;
    q.ins._remove(q);
    q.out = null;
  }

  _n(t: T) {
    const u = this.out;
    if (!u) return;
    u._n(t);
  }

  _e(err: any) {
    const q = this;
    const u = q.out;
    if (!u) return;
    try {
      q.ins._remove(q);
      (q.ins = q.fn(err))._add(q);
    } catch (e) {
      u._e(e);
    }
  }

  _c() {
    const u = this.out;
    if (!u) return;
    u._c();
  }
}

export class StartWithOperator<T> implements InternalProducer<T> {
  public type: string;
  private out: InternalListener<T>;
  public ins: Stream<T>;
  public value: T;

  constructor(s: Stream<T>, v: T) {
    const q = this;
    q.type = 'startWith';
    q.out = emptyIL;
    q.ins = s;
    q.value = v;
  }

  _start(out: InternalListener<T>): void {
    const q = this;
    q.out = out;
    q.out._n(q.value);
    q.ins._add(out);
  }

  _stop(): void {
    const q = this;
    q.ins._remove(q.out);
    q.out = null;
  }
}

export class TakeOperator<T> implements Operator<T, T> {
  public type: string;
  public out: Stream<T>;
  private taken: number;
  public max: number;
  public ins: Stream<T>;

  constructor(m: number, s: Stream<T>) {
    const q = this;
    q.type = 'take';
    q.out = null;
    q.taken = 0;
    q.max = m;
    q.ins = s;
  }

  _start(out: Stream<T>): void {
    const q = this;
    q.out = out;
    q.ins._add(q);
  }

  _stop(): void {
    const q = this;
    q.ins._remove(q);
    q.out = null;
    q.taken = 0;
  }

  _n(t: T) {
    const q = this;
    const u = q.out;
    if (!u) return;
    if (q.taken++ < q.max - 1) {
      u._n(t);
    } else {
      u._n(t);
      u._c();
    }
  }

  _e(err: any) {
    const u = this.out;
    if (!u) return;
    u._e(err);
  }

  _c() {
    const u = this.out;
    if (!u) return;
    u._c();
  }
}

export class Stream<T> implements InternalListener<T> {
  protected _ils: Array<InternalListener<T>>; // 'ils' = Internal listeners
  protected _stopID: any;
  protected _prod: InternalProducer<T>;
  protected _target: Stream<T>; // imitation target if this Stream will imitate
  protected _err: any;

  constructor(producer?: InternalProducer<T>) {
    const q = this;
    q._prod = producer;
    q._ils = [];
    q._stopID = empty;
    q._target = null;
    q._err = null;
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
    const q = this;
    if (q._err) return;
    q._err = err;
    const a = q._ils;
    const L = a.length;
    if (L == 1) a[0]._e(err); else {
      const b = copy(a);
      for (let i = 0; i < L; i++) b[i]._e(err);
    }
    q._x();
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
    const q = this;
    if (q._ils.length === 0) return;
    if (q._prod) q._prod._stop();
    q._err = null;
    q._ils = [];
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
    const q = this;
    const ta = q._target;
    if (ta) return ta._add(il);
    const a = q._ils;
    a.push(il);
    if (a.length === 1) {
      if (q._stopID !== empty) {
        clearTimeout(q._stopID);
        q._stopID = empty;
      }
      const p = q._prod;
      if (p) p._start(q);
    }
  }

  _remove(il: InternalListener<T>): void {
    const q = this;
    const ta = q._target;
    if (ta) return ta._remove(il);
    const a = q._ils;
    const i = a.indexOf(il);
    if (i > -1) {
      a.splice(i, 1);
      const p = q._prod;
      if (p && a.length <= 0) {
        q._err = null;
        q._stopID = setTimeout(() => p._stop());
      } else if (a.length === 1) {
        q._pruneCycles();
      }
    }
  }

  // If all paths stemming from `this` stream eventually end at `this`
  // stream, then we remove the single listener of `this` stream, to
  // force it to end its execution and dispose resources. This method
  // assumes as a precondition that this._ils has just one listener.
  _pruneCycles() {
    const q = this;
    if (q._hasNoSinks(q, [])) {
      q._remove(q._ils[0]);
    }
  }

  // Checks whether *there is no* path starting from `x` that leads to an end
  // listener (sink) in the stream graph, following edges A->B where B is a
  // listener of A. This means these paths constitute a cycle somehow. Is given
  // a trace of all visited nodes so far.
  _hasNoSinks(x: InternalListener<any>, trace: Array<any>): boolean {
    const q = this;
    if (trace.indexOf(x) !== -1) {
      return true;
    } else if ((<OutSender<any>><any>x).out === q) {
      return true;
    } else if ((<OutSender<any>><any>x).out) {
      return q._hasNoSinks((<OutSender<any>><any>x).out, trace.concat(x));
    } else if ((<Stream<any>>x)._ils) {
      for (let i = 0, N = (<Stream<any>>x)._ils.length; i < N; i++) {
        if (!q._hasNoSinks((<Stream<any>>x)._ils[i], trace.concat(x))) {
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
  static merge<T>(...streams: Array<Stream<T>>): Stream<T> {
    return new Stream<T>(new MergeProducer(streams));
  }

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
  static combine: CombineSignature = <CombineSignature>
    function combine(...streams: Array<Stream<any>>): Stream<Array<any>> {
      return new Stream<Array<any>>(new CombineProducer<any>(streams));
    };

  protected _map<U>(project: (t: T) => U): Stream<U> | MemoryStream<U> {
    const q = this;
    const p = q._prod;
    const ctor = q.ctor();
    if (p instanceof FilterOperator) {
      return new ctor<U>(new FilterMapOperator(
        (<FilterOperator<T>> p).passes,
        project,
        (<FilterOperator<T>> p).ins
      ));
    }
    if (p instanceof FilterMapOperator) {
      return new ctor<U>(new FilterMapOperator(
        (<FilterMapOperator<T, T>> p).passes,
        compose2(project, (<FilterMapOperator<T, T>> p).project),
        (<FilterMapOperator<T, T>> p).ins
      ));
    }
    if (p instanceof MapOperator) {
      return new ctor<U>(new MapOperator(
        compose2(project, (<MapOperator<T, T>> p).project),
        (<MapOperator<T, T>> p).ins
      ));
    }
    return new ctor<U>(new MapOperator(project, q));
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
    const op: Operator<T, U> = <Operator<T, U>> s._prod;
    op.type = op.type.replace('map', 'mapTo');
    return s;
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
    return new (this.ctor())<T>(new TakeOperator(amount, this));
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
    return new MemoryStream<T>(new StartWithOperator(this, initial));
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
    return new (this.ctor())<T>(new EndWhenOperator(other, this));
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
    return new MemoryStream<R>(new FoldOperator(accumulate, seed, this));
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
    return new (this.ctor())<T>(new ReplaceErrorOperator(replace, this));
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
      p instanceof MapOperator && !(p instanceof FilterMapOperator) ?
        new MapFlattenOperator(<MapOperator<any, Stream<R>>> <any> p) :
        new FlattenOperator(<Stream<Stream<R>>> <any> this)
    );
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
    return new MemoryStream<T>({
      _start: (il: InternalListener<T>) => {
        const p = this._prod;
        if (p) p._start(il);
      },
      _stop: () => {
        const p = this._prod;
        if (p) p._stop();
      },
    });
  }

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
  debug(labelOrSpy?: string | ((t: T) => void)): Stream<T> {
    return new (this.ctor())<T>(new DebugOperator(labelOrSpy, this));
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
  private _v: T;
  private _has: boolean;

  constructor(producer: InternalProducer<T>) {
    super(producer);
    this._v = <T> empty;
    this._has = false;
  }

  _n(x: T) {
    this._v = x;
    this._has = true;
    super._n(x);
  }

  _add(il: InternalListener<T>): void {
    if (this._has) { il._n(this._v); }
    super._add(il);
  }

  _x(): void {
    this._has = false;
    super._x();
  }

  map<U>(project: (t: T) => U): MemoryStream<U> {
    return <MemoryStream<U>> this._map(project);
  }

  mapTo<U>(projectedValue: U): MemoryStream<U> {
    return <MemoryStream<U>> super.mapTo(projectedValue);
  }

  take(amount: number): MemoryStream<T> {
    return <MemoryStream<T>> super.take(amount);
  }

  endWhen(other: Stream<any>): MemoryStream<T> {
    return <MemoryStream<T>> super.endWhen(other);
  }

  replaceError(replace: (err: any) => Stream<T>): MemoryStream<T> {
    return <MemoryStream<T>> super.replaceError(replace);
  }

  debug(labelOrSpy?: string | ((t: T) => void)): MemoryStream<T> {
    return <MemoryStream<T>> super.debug(labelOrSpy);
  }
}

export default Stream;
