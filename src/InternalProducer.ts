import {InternalListener} from './InternalListener';

export interface InternalProducer<T> {
  _start: (listener: InternalListener<T>) => void;
  _stop: () => void;
}
