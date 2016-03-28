import {InternalProducer} from '../InternalProducer';
import {InternalListener} from '../InternalListener';

export class EventProducer implements InternalProducer<Event> {
  private listener: EventListener;

  constructor(private node: EventTarget,
              private eventType: string,
              private useCapture: boolean) {
  }

  _start(out: InternalListener<Event>) {
    this.listener = (e) => out._n(e);
    const {node, eventType, useCapture} = this;
    node.addEventListener(eventType, this.listener, useCapture);
  }

  _stop() {
    const {node, eventType, listener, useCapture} = this;
    node.removeEventListener(eventType, listener, useCapture);
  }
}
