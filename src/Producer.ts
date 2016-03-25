import {Listener} from './Listener';

export interface Producer<T> {
  start: (listener: Listener<T>) => void;
  stop: () => void;
}
