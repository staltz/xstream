import {Observer} from '../Observer';
import {noop} from './noop';
export var emptyObserver: Observer<any> = {
  next: noop,
  error: noop,
  end: noop,
};
