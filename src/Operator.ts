import {InternalProducer} from './InternalProducer';
import {InternalListener} from './InternalListener';
import {Stream} from './Stream';

export interface Operator<T, R> extends InternalProducer<R>, InternalListener<T> {
  _start: (out: Stream<R>) => void;
  _stop: () => void;
  _n: (v: T) => void;
  _e: (err: any) => void;
  _c: () => void;
}
