import {Producer} from '../Producer';
import {Observer} from '../Observer';
import {Stream} from '../Stream';

class EventProducer implements Producer<Event> {
  private listener: EventListener;

  constructor(public node: EventTarget,
              public eventType: string,
              public useCapture: boolean) {
  }

  start(out: Observer<Event>) {
    this.listener = (e) => out.next(e);
    const {node, eventType, useCapture} = this;
    node.addEventListener(eventType, this.listener, useCapture);
  }

  stop() {
    const {node, eventType, listener, useCapture} = this;
    node.removeEventListener(eventType, listener, useCapture);
  }
}

export default function domEvent(node: EventTarget, eventType: string,
                                 useCapture: boolean = false) {
  return new Stream<Event>(new EventProducer(node, eventType, useCapture));
}
