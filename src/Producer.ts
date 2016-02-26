import {Observer} from './Observer';

export interface Producer<T> {
  start: (observer: Observer<T>) => void;
  stop: () => void;
}
