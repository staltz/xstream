import {InternalListener, Operator, Stream} from '../core';

export interface SampleCombineSignature {
  (): <T>(s: Stream<T>) => Stream<[T]>;
  <T1>(s1: Stream<T1>): <T>(s: Stream<T>) => Stream<[T, T1]>;
  <T1, T2>(
    s1: Stream<T1>,
    s2: Stream<T2>): <T>(s: Stream<T>) => Stream<[T, T1, T2]>;
  <T1, T2, T3>(
    s1: Stream<T1>,
    s2: Stream<T2>,
    s3: Stream<T3>): <T>(s: Stream<T>) => Stream<[T, T1, T2, T3]>;
  <T1, T2, T3, T4>(
    s1: Stream<T1>,
    s2: Stream<T2>,
    s3: Stream<T3>,
    s4: Stream<T4>): <T>(s: Stream<T>) => Stream<[T, T1, T2, T3, T4]>;
  <T1, T2, T3, T4, T5>(
    s1: Stream<T1>,
    s2: Stream<T2>,
    s3: Stream<T3>,
    s4: Stream<T4>,
    s5: Stream<T5>): <T>(s: Stream<T>) => Stream<[T, T1, T2, T3, T4, T5]>;
  <T1, T2, T3, T4, T5, T6>(
    s1: Stream<T1>,
    s2: Stream<T2>,
    s3: Stream<T3>,
    s4: Stream<T4>,
    s5: Stream<T5>,
    s6: Stream<T6>): <T>(s: Stream<T>) => Stream<[T, T1, T2, T3, T4, T5, T6]>;
  <T1, T2, T3, T4, T5, T6, T7>(
    s1: Stream<T1>,
    s2: Stream<T2>,
    s3: Stream<T3>,
    s4: Stream<T4>,
    s5: Stream<T5>,
    s6: Stream<T6>,
    s7: Stream<T7>): <T>(s: Stream<T>) => Stream<[T, T1, T2, T3, T4, T5, T6, T7]>;
  <T1, T2, T3, T4, T5, T6, T7, T8>(
    s1: Stream<T1>,
    s2: Stream<T2>,
    s3: Stream<T3>,
    s4: Stream<T4>,
    s5: Stream<T5>,
    s6: Stream<T6>,
    s7: Stream<T7>,
    s8: Stream<T8>): <T>(s: Stream<T>) => Stream<[T, T1, T2, T3, T4, T5, T6, T7, T8]>;
  (...streams: Array<Stream<any>>): (s: Stream<any>) => Stream<Array<any>>;
}

const NO = {};

export class SampleCombineListener<T> implements InternalListener<T> {
  constructor(private i: number, private p: SampleCombineOperator<any>) {
    p.ils[i] = this;
  }

  _n(t: T): void {
    const p = this.p;
    if (p.out === NO) return;
    p.up(t, this.i);
  }

  _e(err: any): void {
    this.p._e(err);
  }

  _c(): void {
    this.p.down(this.i, this);
  }
}

export class SampleCombineOperator<T> implements Operator<T, Array<any>> {
  public type = 'sampleCombine';
  public ins: Stream<T>;
  public others: Array<Stream<any>>;
  public out: Stream<Array<any>>;
  public ils: Array<SampleCombineListener<any>>;
  public Nn: number; // *N*umber of streams still to send *n*ext
  public vals: Array<any>;

  constructor(ins: Stream<T>, streams: Array<Stream<any>>) {
    this.ins = ins;
    this.others = streams;
    this.out = NO as Stream<Array<any>>;
    this.ils = [];
    this.Nn = 0;
    this.vals = [];
  }

  _start(out: Stream<Array<any>>): void {
    this.out = out;
    const s = this.others;
    const n = this.Nn = s.length;
    const vals = this.vals = new Array(n);
    for (let i = 0; i < n; i++) {
      vals[i] = NO;
      s[i]._add(new SampleCombineListener<any>(i, this));
    }
    this.ins._add(this);
  }

  _stop(): void {
    const s = this.others;
    const n = s.length;
    const ils = this.ils;
    this.ins._remove(this);
    for (let i = 0; i < n; i++) {
      s[i]._remove(ils[i]);
    }
    this.out = NO as Stream<Array<any>>;
    this.vals = [];
    this.ils = [];
  }

  _n(t: T): void {
    const out = this.out;
    if (out === NO) return;
    if (this.Nn > 0) return;
    out._n([t, ...this.vals]);
  }

  _e(err: any): void {
    const out = this.out;
    if (out === NO) return;
    out._e(err);
  }

  _c(): void {
    const out = this.out;
    if (out === NO) return;
    out._c();
  }

  up(t: any, i: number): void {
    const v = this.vals[i];
    if (this.Nn > 0 && v === NO) {
      this.Nn--;
    }
    this.vals[i] = t;
  }

  down(i: number, l: SampleCombineListener<any>): void {
    this.others[i]._remove(l);
  }
}

let sampleCombine: SampleCombineSignature;

/**
 *
 * Combines a source stream with multiple other streams. The result stream
 * will emit the latest events from all input streams, but only when the
 * source stream emits.
 *
 * If the source, or any input stream, throws an error, the result stream
 * will propagate the error. If any input streams end, their final emitted
 * value will remain in the array of any subsequent events from the result
 * stream.
 *
 * The result stream will only complete upon completion of the source stream.
 *
 * Marble diagram:
 *
 * ```text
 * --1----2-----3--------4--- (source)
 * ----a-----b-----c--d------ (other)
 *      sampleCombine
 * -------2a----3b-------4d--
 * ```
 *
 * Examples:
 *
 * ```js
 * import sampleCombine from 'xstream/extra/sampleCombine'
 * import xs from 'xstream'
 *
 * const sampler = xs.periodic(1000).take(3)
 * const other = xs.periodic(100)
 *
 * const stream = sampler.compose(sampleCombine(other))
 *
 * stream.addListener({
 *   next: i => console.log(i),
 *   error: err => console.error(err),
 *   complete: () => console.log('completed')
 * })
 * ```
 *
 * ```text
 * > [0, 8]
 * > [1, 18]
 * > [2, 28]
 * ```
 *
 * ```js
 * import sampleCombine from 'xstream/extra/sampleCombine'
 * import xs from 'xstream'
 *
 * const sampler = xs.periodic(1000).take(3)
 * const other = xs.periodic(100).take(2)
 *
 * const stream = sampler.compose(sampleCombine(other))
 *
 * stream.addListener({
 *   next: i => console.log(i),
 *   error: err => console.error(err),
 *   complete: () => console.log('completed')
 * })
 * ```
 *
 * ```text
 * > [0, 1]
 * > [1, 1]
 * > [2, 1]
 * ```
 *
 * @param {...Stream} streams One or more streams to combine with the sampler
 * stream.
 * @return {Stream}
 */
sampleCombine = function sampleCombine(...streams: Array<Stream<any>>) {
  return function sampleCombineOperator(sampler: Stream<any>): Stream<Array<any>> {
    return new Stream<Array<any>>(new SampleCombineOperator(sampler, streams));
  };
} as SampleCombineSignature;

export default sampleCombine;