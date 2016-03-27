import {InternalListener} from '../InternalListener';
import {noop} from './noop';
export var emptyListener: InternalListener<any> = {
  _n: noop,
  _e: noop,
  _c: noop,
};
