import {CombineSignature, InternalListener, Operator, Stream} from '../core';

export class SampleCombineListener<T> implements InternalListener<T> {
    constructor(private i: number, private p: SampleCombineOperator<any>) {
        p.ils[i] = this;
    }

    _n(t: T): void {
        if (!this.p.out) return;
        this.p.vals[this.i] = t;
    }

    _e(err: any): void {
        this.p._e(err);
    }

    _c(): void {
        this.p.d(this.i, this);
    }
}

export class SampleCombineOperator<T> implements Operator<T, Array<any>> {
  public type = 'sampleCombine';
  public out: Stream<Array<any>>;
  public vals: Array<any> = [];
  public Sc: number = 0;
  public ils: Array<SampleCombineListener<any>> = [];

  constructor(public ins: Stream<T>,
              public streams: Array<Stream<any>>) {}

  _start(out: Stream<Array<any>>): void {
      if (!this.ins || !this.streams) {
          out._n([]);
          out._c();
      } else {
          this.Sc = this.streams.length;
          this.ins._add(this);
          this.out = out;
          if (this.Sc) {
              for (let i = 0; i < this.Sc; i++) {
                  this.vals[i] = undefined;
                  this.streams[i]._add(new SampleCombineListener<any>(i, this));
              }
          }
      }
  }

  _stop(): void {
      if (!this.ins || this.Sc) return;
      this.ins._remove(this);
      this.out = this.vals = null;
      for (let i = 0; i < this.Sc; i++) {
        this.streams[i]._remove(this.ils[i]);
      }
  }

  _n(t: T): void {
      if (!this.out) return;
      this.out._n([t, ...this.vals]);
  }

  _e(err: any): void {
      if (!this.out) return;
      this.out._e(err);
  }

  _c(): void {
      if (!this.out) return;
      this.out._c();
  }

  d(i: number, l: SampleCombineListener<any>): void {
      this.streams[i]._remove(l);
  }
}

/**
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
 * --1----2-----3--------4---
 * ----a-----b-----c--d------
 *      sampleCombine
 * --1?---2a----3b-------4d--
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
 * const stream = sampleCombine(sampler, other)
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
 * const stream = sampleCombine(sampler, other)
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
 * @param {Stream} sampler The source stream of which to sample.
 * @param {...Stream} streams One or more streams to combine.
 * @return {Stream}
 */
let sampleCombine: CombineSignature;
sampleCombine = function(sampler: Stream<any>,
                         ...streams: Array<Stream<any>>): Stream<Array<any>> {
    return new Stream<Array<any>>(new SampleCombineOperator<any>(sampler, streams));
} as CombineSignature;

export default sampleCombine;
