import {Stream} from './Stream';
import {Producer} from './Producer';
import {Observer} from './Observer';
import from from './factory/from';
import merge from './factory/merge';
import interval from './factory/interval';

export {
  Producer,
  Observer,
  Stream,
};

export default {
  Stream,
  from,
  merge,
  interval,
};
