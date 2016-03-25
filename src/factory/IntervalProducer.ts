import {Producer} from '../Producer';
import {Listener} from '../Listener';

export class IntervalProducer implements Producer<number> {
  on: boolean;
  intervalID: any;
  i: number;

  constructor(public period: number) {
    this.intervalID = -1;
    this.i = 0;
  }

  start(stream: Listener<number>): void {
    const self = this;
    function intervalHandler() { stream.next(self.i++); }
    this.intervalID = setInterval(intervalHandler, this.period);
  }

  stop(): void {
    this.i = 0;
    if (this.intervalID !== -1) clearInterval(this.intervalID);
  }
}
