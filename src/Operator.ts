import {Producer} from './Producer';
import {Stream} from './Stream';

export interface Operator<T, R> extends Producer<R> {
  start: (out: Stream<R>) => void;
  stop: () => void;
  ins: Stream<T>;
}
