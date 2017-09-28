import {InternalProducer, InternalListener, Stream} from '../index';

class Periodic implements InternalProducer<number> {
  public type = 'periodic';
  public period: number;
  private intervalID: any;
  private i: number;

  constructor(period: number) {
    this.period = period;
    this.intervalID = -1;
    this.i = 0;

    console.warn('All time based operators have been deprecated, please migrate to @cycle/time');
  }

  _start(out: InternalListener<number>): void {
    const self = this;
    function intervalHandler() { out._n(self.i++); }
    this.intervalID = setInterval(intervalHandler, this.period);
  }

  _stop(): void {
    if (this.intervalID !== -1) clearInterval(this.intervalID);
    this.intervalID = -1;
    this.i = 0;
  }
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
export default function periodic(period: number): Stream<number> {
  return new Stream<number>(new Periodic(period));
}
