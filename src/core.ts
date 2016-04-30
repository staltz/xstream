import {Promise} from 'es6-promise';

const none = {}; 
const empty = {};

function noop() {}


function times <T>(n: number, fn: (i: number) => T) {
  return Array.apply(null, {length: n}).map((_:any, i: number) => fn(i))
}

function remove<T>(arr: Array<T>, x: T): number {
  let i: number, n = arr.length;
  for (i = 0; i < n; i++) {
    if (arr[i] === x) {
      arr.splice(i, 1);
      return n - 1;
    }
  }
  return n;
}

// fast invoke table
const iTable = times(10, i => 
  eval(`(function invoke${i}(f, x) { return f(${times(i, i => "x["+i+"]").join(",")}); })`))

function invokeF<A>(f: (...args: Array<any>) => A, x: Array<any>): A {
  const n = x.length;
  return n < 10 ? iTable[n](f, x) : f.apply(null, x);
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



// class for easy deferred task creation and calcelation
class Deferred { 
  private t: any
  constructor(task: () => void) {
    this.t = setTimeout(task, 0);
  }
  cancel() {
    let t: any;
    (t = this.t) && clearTimeout(t) && (this.t = null);
  }
}

function defer(task: () => void): Deferred {
  return new Deferred(task);
}


export interface ErrorHandler {
  error(err: any): void;
}

// generic unicast sink
export interface Sink<A, B> {
  next(x: A): void;
  end(): void;
  cleanup(): void;
  handler(): ErrorHandler;
}

// multicast capable sink interface
export interface MSink<A, B> extends Sink<A, B> {
  s: Sink<B, any>;
}

// source without multicasting
export interface Source<A> {
  start<T> (sink: Sink<A, T>): void;
  stop<T> (sink: Sink<A, T>): void;
}

// basic abstract multicast-capable sink
abstract class MCastSink<A, B> implements MSink<A, B> {
  s: Sink<B, any>;
  constructor(sink: Sink<B, any>) {
    this.s = sink;
  }
  
  abstract next(x: A): void 
  
  end(): void {
    this.s.end();
  }
  cleanup(): void {
    this.s = null;
  }
  handler(): ErrorHandler {
    return this.s.handler();
  }
}

// basic multicast-capable identity sink 
class IdentitySink<A> extends MCastSink<A, A> {
  constructor(sink: Sink<A, any>) {
    super(sink);
  }
  next(x: A) {
    this.s.next(x);
  }
}


function handleError(err: any, sink: Sink<any, any>): void {
  sink.handler().error(err);
}

function safeNext<T>(s: Sink<T, any>, x: T): void {
  try {
    s.next(x);  
  } catch (err) {
    handleError(err, s);
  }
}

// table for optimized safe multicast next functions 
const mcastTable = times(10, i => 
  eval(`(function mcast${i}(h,s,n,x) { var i=${i}; try{ ${times(i, i => "s[--i].next(x);").join("")} }catch(e){h(e,s[i]);i>0&&n[i](h,s,n,x);} })`));

function multicastN<T>(x: T, s: Array<any>) {
  let n = s.length, i: number;
  for (i = 0; i < n; i++) safeNext(s[i], x);
} 

// sink that does multicasting and error reporting in safe ways
class MulticastingSink<A, B> implements Sink<A, B>, ErrorHandler {
  private n: number;
  constructor(private sinks: Array<Sink<A, B>>) {
    this.n = this.sinks.length;
  }
  next(x: A) {
    this.n < 10 ? mcastTable[this.n](handleError, this.sinks, mcastTable, x) 
      : multicastN(x, this.sinks);
  }
  end() {
    let s = this.sinks, n = s.length, i: number;
    for(i = 0; i < n; i++) s[i].end(); 
  }
  error(err: any) {
    let s = this.sinks, n = s.length, i: number;
    for(i = 0; i < n; i++) handleError(err, s[i]); 
  }
  cleanup() {
    this.sinks = null;
  }
  handler(): ErrorHandler {
    return this;
  }
}

// Note that combinator is not actually operator because it doesn't do any calculation.
// The purpose of combinator is just to combine operators and ensure that their
// lifecycle is managed correctly. Combinators also deal multicasting
export abstract class Combinator<A, B> implements Source<B> {
  source: Source<A>;
  sink: MSink<A, B>;
  sinks: Array<Sink<B, any>>;
  
  constructor(source: Source<A>) {
    this.source = source;
    this.sink = null;
    this.sinks = [];
  }
  
  abstract run(next: Sink<B, any>): MSink<A, B>
  
  start(next: Sink<B, any>): void {
    this.sinks.push(next);
    if (this.sink === null) {
      const s = this.sink = this.run(next);
      this.source.start(s);
      // the combinator might already be stopped (-> this.sink == null) so we must check 
      // it before invoking our started hook
      this.sink && this.started(this.sink);
    } else {
      const s = this.sink
      s.s = new MulticastingSink(this.sinks.slice());
    }
  }
  
  stop(sink: Sink<B, any>): void {
    const left = remove(this.sinks, sink);
    const s = this.sink;
    if (left === 0) {
      this.sink = null;
      this.source.stop(s);
      s.cleanup();
    } else if (left === 1) {
      s.s.cleanup();
      s.s = this.sinks[0];
    } else {
      s.s.cleanup();
      s.s = new MulticastingSink(this.sinks.slice());
    }
  }
  
  started(sink: Sink<A, B>): void { }
}

// this identity combinator is needed for our sources (producers) so that
// we can wrap the producers and don't need to think about their multicasting
class MulticastedIdentity<A> extends Combinator<A, A> {
  constructor(source: Source<A>) {
    super(source);
  }
  run(next: MSink<A, any>) {
    return new IdentitySink(next);
  }
}

function multicast<A>(source: Source<A>): Combinator<A, A> {
  return new MulticastedIdentity(source);
}




// Observer is the last step that is 100% in our control in our subscription 
// chain. Its task is to ensure that subscriptions are disposed immediately if 
// the underlying producer ends/errors and to defer disposal if dispose is called
// by the userland code (listener)
class Observer<T> implements Sink<T, T>, ErrorHandler {
  private lis: Listener<T>;
  private source: Source<T>;
  private c: boolean;   // completed
  private a: boolean;   // activated
  constructor(source: Source<T>, l: Listener<T>) {
    this.c = this.a = false;
    this.lis = l;
    this.source = source;
  }
  // Start is called only once during Observer's lifecycle, hence we're not doing
  // any futher checks
  start(): void {
    this.source.start(this);
    this.a = true;
    if (this.c) {
      this._stop();
    }
  }
  stop(): void {
    if (!this.a) return; 
    this.c = true;        
    defer(() => {
      this._stop();
    });
  }
  next(x: T): void {
    !this.c && this.lis.next(x);
  }
  error(err: any) {
    const lis = this.lis;
    this.c = true;
    this._stop();
    try {
      lis.error(err);
    } catch (e) {
      console.error(e);
    }
  }
  end(): void {
    const lis = this.lis;
    this.c = true;
    this._stop();
    try {
      lis.complete();
    } catch (e) {
      console.error(e);
    }
  }
  _stop(): void {
    // end signal might arrive before the startup completed, thus we must check
    // the active status here before stopping the producer
    if (this.a) {
      this.a = false;
      this.source.stop(this);
      this.cleanup();
    }
  }
  cleanup(): void { 
    this.source = null;
    this.lis = null;
  }
  handler(): ErrorHandler {
    return this;
  }
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

export class FromArrayProducer<T> implements Source<T> {
  private active: boolean;
  constructor(private a: Array<T>) {
    this.active = false;
  }
  
  start(sink: Sink<T, any>) {
    this.active = true;
    function produce(self: FromArrayProducer<T>) {
      let i: number, arr = self.a, n = arr.length;
      for (i = 0; i < n && self.active; i++) {
        sink.next(arr[i]);
      } 
      self.active && sink.end();
      self.active = false;  
    }
    try {
      produce(this);
    } catch (err) {
      handleError(err, sink);
    }
  }
  
  stop(sink: Sink<T, any>) {
    this.active = false;
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

class PeriodicProducer implements Source<number> {
  private iid: any = -1;    // interval id
  private i: number = 0;
  
  constructor(private period: number) { }

  start<T>(sink: Sink<number, T>): void {
    this.iid = setInterval(() => {
      try {
        sink.next(this.i++); 
      } catch(err) {
        handleError(err, sink);
      }
    }, this.period);
  }
  stop<T>(sink: Sink<number, any>): void {
    this.iid !== -1 && clearTimeout(this.iid);
    this.iid = -1;
    this.i = 0;
  }
}

class CustomProducer<A> implements Source<A> {
  private lis: Listener<A>;
  private sink: Sink<A, any>;
  constructor(private prod: Producer<A>) { 
    this.sink = null;
    this.lis = {
      next: x => {
        const s = this.sink;
        try {
          s && s.next(x);
        } catch (err) {
          handleError(err, s);
        }
      },
      complete: () => this.sink && this.sink.end(),
      error: err => this.sink && handleError(err, this.sink)
    };
  }
  start<B>(sink: Sink<A, B>): void {
    this.sink = sink;
    this.prod.start(this.lis);
  }
  stop<B>(sink: Sink<A, B>): void {
    this.sink = null;
    this.prod.stop();
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



class Filter<A, B> extends Combinator<A, A> {
  constructor(source: Source<A>, private pred: (x: A) => boolean) {
    super(source);
  }
  run(next: MSink<A, any>) {
    return new FilterSink(next, this.pred);
  }
}

class FilterSink<A> extends MCastSink<A, A> {
  constructor(sink: Sink<A, any>, private pred: (x: A) => boolean) {
    super(sink);
  }
  next(x: A): void {
    const p = this.pred;
    p(x) && this.s.next(x);
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

class Fold<A, B> extends Combinator<A, B> {
  constructor(source: Source<A>, private acc: (s: B, a: A) => B, private seed: B) {
    super(source);
  }
  run(next: Sink<B, any>) {
    return new FoldSink(next, this.acc, this.seed);
  }
  started(sink: Sink<A, B>) {
    (sink as FoldSink<A, B>).s.next(this.seed);
  }
}

class FoldSink<A, B> extends MCastSink<A, B> {
  constructor(sink: Sink<B, any>, private acc: (s: B, a: A) => B, private val: B) {
    super(sink);
  }
  next(x: A): void {
    const acc = this.acc;
    this.s.next(this.val = acc(this.val, x));
  }
}


class Last<A, B> extends Combinator<A, A> {
  constructor(source: Source<A>) {
    super(source);
  }
  run(next: Sink<A, any>) {
    return new LastSink(next);
  }
}

class LastSink<A> extends MCastSink<A, A> {
  private val: A;
  constructor(sink: Sink<A, any>) {
    super(sink);
    this.val = none as A;
  }
  next(x: A): void {
    this.val = x;
  }
  end(): void {
    let v: A;
    (v = this.val) !== none && this.s.next(v);
    this.s && this.s.end();
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

export interface MapOperator<A, B> extends Operator<A, B> {}

export class MapFlattenConcOperator<T> implements InternalProducer<T>, InternalListener<T> {
  private active: number = 1; // number of outers and inners that have not yet ended
  private out: Stream<T> = null;

  constructor(public mapOp: MapOperator<T, Stream<T>>) {
  }

  _start(out: Stream<T>): void {
    this.out = out;
    //this.mapOp.ins._add(this);
  }

  _stop(): void {
    //this.mapOp.ins._remove(this);
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
      //this.mapOp.project(v)._add(new MFCInner(this.out, this));
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
    //this.mapOp.ins._add(this);
  }

  _stop(): void {
    //this.mapOp.ins._remove(this);
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
      //(this.curr = this.mapOp.project(v))._add(this.inner = new MFInner(this.out, this));
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

class Map<A, B> extends Combinator<A, B> {
  private fn: (x: A) => B;
  constructor(source: Source<A>, fn: (x: A) => B) {
    super(source);
    this.fn = fn;
  }
  run(next: Sink<B, any>) {
    return new MapSink(next, this.fn);
  }
}

class MapSink<A, B> extends MCastSink<A, B> {
  constructor(sink: Sink<B, any>, private fn: (x: A) => B) {
    super(sink);
  }
  next(x: A): void {
    const f = this.fn;
    this.s.next(f(x));
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

// we know that this combinator is always unicast so we can override the stop
// function without knowing anything about multicast or its implementation details
class ReplaceErrorUnicast<A, B> extends Combinator<A, A> {
  constructor(source: Source<A>, private fn: (err: any) => Stream<A>) {
    super(source);
  }
  run(next: Sink<A, any>) {
    return new ReplaceErrorSink(next, this.source, this.fn);
  }
  stop(_: Sink<A, B>) {
    const s = this.sink as ReplaceErrorSink<A>;
    this.next = [];
    this.sink = null;
    s.cleanup();
  }
}

class ReplaceError<A, B> extends Combinator<A, A> {
  constructor(source: Source<A>, fn: (err: any) => Stream<A>) {
    super(new ReplaceErrorUnicast(source, fn));
  }
  run(next: Sink<A, any>) {
    return next;
  }
}

class ReplaceErrorSink<A> extends IdentitySink<A> implements ErrorHandler {
  private d: Deferred;
  constructor(sink: Sink<A, any>, private source: Source<A>, private fn: (err: any) => Stream<A>) {
    super(sink);
    this.d = null;
  }
  error(err: any): void {
    this.source.stop(this);
    this.source = null;
    try {
      const next = this.fn(err).source;
      this.d && this.d.cancel();
      this.d = defer(() => {
        this.d = null;
        (this.source = next).start(this);
      });
    } catch (err) {
      handleError(err, this.s);
    }
  }
  cleanup(): void {
    const src = this.source;
    this.d && this.d.cancel() && (this.d = null);
    this.source = null;
    src && src.stop(this);
    super.cleanup();
  }
  handler(): ErrorHandler {
    return this;
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

class Take<A, B> extends Combinator<A, A> {
  private n: number;
  constructor(source: Source<A>, n: number) {
    super(source);
    this.n = Math.max(0, n);
  }
  run(next: Sink<A, any>) {
    return new TakeSink(next, this.n);
  }
  started(sink: Sink<A, B>) {
    this.n === 0 && sink.end();
  }
}

class TakeSink<A> extends MCastSink<A, A> {
  private n: number;
  constructor(sink: Sink<A, any>, n: number) {
    super(sink);
    this.n = n;
  }
  next(x: A): void {
    switch (this.n) {
      case 0: return;
      case 1:
        this.n--;
        this.s.next(x);
        this.s.end();
        return;
      default:
        this.n-- && this.s.next(x);
    }
  }
}


declare type Subscription <T> = {
  listener: Listener<T>;
  observer: Observer<T>;
}

export class Stream<T> {
  private _subs: Array<Subscription<T>>;
  constructor(public source: Source<T>) {
    this._subs = [];
  }
 
  /**
   * Adds a Listener to the Stream.
   *
   * @param {Listener<T>} listener
   */
  addListener(listener: Listener<T>): void {
    const s: Subscription<T> = {
      listener,
      observer: new Observer(this.source, listener)
    };
    this._subs.push(s);
    s.observer.start();
  }

  /**
   * Removes a Listener from the Stream, assuming the Listener was added to it.
   *
   * @param {Listener<T>} listener
   */
  removeListener(listener: Listener<T>): void {
    for (let i = 0; i < this._subs.length; i++) {
      const s = this._subs[i];
      if (s.listener === listener) {
        s.observer.stop();
        this._subs.splice(i, 1);
        return;
      }
    }
  }
  
  _n(t: T): void {
  }

  _e(err: any): void {
  }

  _c(): void {
  }

  _x(): void {
  }

  _add(il: InternalListener<T>): void {
  }

  _remove(il: InternalListener<T>): void {
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
    return !producer ? Stream.empty() : new Stream(multicast(new CustomProducer(producer)));
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
    throw new Error("Not implemented yet");
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
    return Stream.create({start: noop, stop: noop});
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
    return Stream.create({
      start: lis => lis.complete(),
      stop: noop
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
    return Stream.create({
      start: lis => lis.error(error),
      stop: noop
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
    return new Stream(multicast(new FromArrayProducer(array)));
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
    throw new Error("Not implemented yet");
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
    return new Stream(multicast(new PeriodicProducer(period)));
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
    throw new Error("Not implemented yet");
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
      throw new Error("Not implemented yet");
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
    return new Stream(new Map(this.source, project));
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
    throw new Error("Not implemented yet");
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
    return new Stream(new Filter(this.source, passes));
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
    return new Stream(new Take(this.source, amount));
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
    throw new Error("Not implemented yet");
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
    return new Stream(new Last(this.source));
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
    throw new Error("Not implemented yet");
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
    throw new Error("Not implemented yet");
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
    return new Stream(new Fold(this.source, accumulate, seed));
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
    return new Stream(new ReplaceError(this.source, replace));
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
  flatten<R, T extends Stream<R>>(): T {
    throw new Error("Not implemented yet");
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
  flattenConcurrently<R, T extends Stream<R>>(): T {
    throw new Error("Not implemented yet");
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
    throw new Error("Not implemented yet");
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
      throw new Error("Not implemented yet");
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
    throw new Error("Not implemented yet");
  }

  /**
   * Returns an output stream that imitates the input stream, but also remembers
   * the most recent event that happens on the input stream, so that a newly
   * added listener will immediately receive that memorised event.
   *
   * @return {Stream}
   */
  remember(): Stream<T> {
    throw new Error("Not implemented yet");
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
    throw new Error("Not implemented yet");
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
    throw new Error("Not implemented yet");
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
    throw new Error("Not implemented yet");
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
    throw new Error("Not implemented yet");
  }

  /**
   * Forces the Stream to emit the "completed" event to its listeners.
   *
   * As the name indicates, if you use this, you are most likely doing something
   * The Wrong Way. Please try to understand the reactive way before using this
   * method. Use it only when you know what you are doing.
   */
  shamefullySendComplete() {
    throw new Error("Not implemented yet");
  }

}

export class MemoryStream<T> extends Stream<T> {
  _n(x: T) {
    throw new Error("Not implemented yet");
  }

  _add(listener: InternalListener<T>): void {
    throw new Error("Not implemented yet");
  }
}

export default Stream;
