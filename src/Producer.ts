import {Listener} from './Listener';

export interface Producer<T> {
  start: (observer: Listener<T>) => void;
  stop: () => void;
}
