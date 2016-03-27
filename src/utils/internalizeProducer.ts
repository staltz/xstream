import {InternalListener} from '../InternalListener';
import {Listener} from '../Listener';
import {InternalProducer} from '../InternalProducer';
import {Producer} from '../Producer';

// mutates the input
export function internalizeProducer<T>(producer: Producer<T>) {
  (<InternalProducer<T>> (<any> producer))._start =
    function _start(il: InternalListener<T>) {
      (<Listener<T>> (<any> il)).next = il._n;
      (<Listener<T>> (<any> il)).error = il._e;
      (<Listener<T>> (<any> il)).complete = il._c;
      this.start(<Listener<T>> (<any> il));
    };
  (<InternalProducer<T>> (<any> producer))._stop = producer.stop;
}
