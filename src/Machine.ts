import {Observer} from './Observer';

export interface Machine<T> {
  start: (observer: Observer<T>) => void;
  stop: () => void;
}
