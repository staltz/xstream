import {Listener} from '../Listener';
import {noop} from './noop';
export var emptyListener: Listener<any> = {
  next: noop,
  error: noop,
  end: noop,
};
