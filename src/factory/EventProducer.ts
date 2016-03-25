import {Producer} from '../Producer';
import {Listener} from '../Listener';

export class EventProducer implements Producer<Event> {
  private listener: EventListener;

  constructor(public node: EventTarget,
              public eventType: string,
              public useCapture: boolean) {
  }

  start(out: Listener<Event>) {
    this.listener = (e) => out.next(e);
    const {node, eventType, useCapture} = this;
    node.addEventListener(eventType, this.listener, useCapture);
  }

  stop() {
    const {node, eventType, listener, useCapture} = this;
    node.removeEventListener(eventType, listener, useCapture);
  }
}
