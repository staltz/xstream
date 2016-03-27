import {InternalProducer} from './InternalProducer';
import {Stream} from './Stream';

export interface Operator<T, R> extends InternalProducer<R> {
  _start: (out: Stream<R>) => void;
  _stop: () => void;
  ins: Stream<T>;
}
