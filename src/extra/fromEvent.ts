import {Stream, InternalProducer, InternalListener} from '../core';

export class DOMEventProducer implements InternalProducer<Event> {
  public type = 'fromEvent';
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
    this.listener = null;
  }
}

/**
 * Creates a stream based on DOM events of type `eventType` from the target
 * node.
 *
 * Marble diagram:
 *
 * ```text
 *   fromEvent(node, eventType)
 * ---ev--ev----ev---------------
 * ```
 *
 * Example:
 *
 * ```js
 * import fromEvent from 'xstream/extra/fromEvent'
 *
 * const stream = fromEvent(document.querySelector('.button'), 'click')
 *   .mapTo('Button clicked!')
 *
 * stream.addListener({
 *   next: i => console.log(i),
 *   error: err => console.error(err),
 *   complete: () => console.log('completed')
 * })
 * ```
 *
 * ```text
 * > 'Button clicked!'
 * > 'Button clicked!'
 * > 'Button clicked!'
 * ```
 *
 * @param {EventTarget} node The element we want to listen to.
 * @param {string} eventType The type of events we want to listen to.
 * @param {boolean} useCapture An optional boolean that indicates that events of
 * this type will be dispatched to the registered listener before being
 * dispatched to any EventTarget beneath it in the DOM tree. Defaults to false.
 * @return {Stream}
 */
export default function fromEvent(node: EventTarget,
                                  eventType: string,
                                  useCapture: boolean = false): Stream<Event> {
  return new Stream<Event>(new DOMEventProducer(node, eventType, useCapture));
}
