import {Promise} from '~es6-promise/dist/es6-promise';
import {InternalProducer} from '../InternalProducer';
import {InternalListener} from '../InternalListener';

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
