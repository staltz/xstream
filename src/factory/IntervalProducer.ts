import {InternalProducer} from '../InternalProducer';
import {InternalListener} from '../InternalListener';

export class IntervalProducer implements InternalProducer<number> {
  on: boolean;
  intervalID: any;
  i: number;

  constructor(private period: number) {
    this.intervalID = -1;
    this.i = 0;
  }

  _start(stream: InternalListener<number>): void {
    const self = this;
    function intervalHandler() { stream._n(self.i++); }
    this.intervalID = setInterval(intervalHandler, this.period);
  }

  _stop(): void {
    this.i = 0;
    if (this.intervalID !== -1) clearInterval(this.intervalID);
  }
}
