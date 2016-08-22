/// <reference path="../../typings/globals/node/index.d.ts" />
import {EventEmitter} from 'events';
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
    this.node.addEventListener(this.eventType, this.listener, this.useCapture);
  }

  _stop() {
    this.node.removeEventListener(this.eventType, this.listener, this.useCapture);
    this.listener = null;
  }
}

export class NodeEventProducer implements InternalProducer<any> {
  public type = 'fromEvent';
  private listener: Function;

  constructor(private node: EventEmitter, private eventName: string) { }

  _start(out: InternalListener<any>) {
    this.listener = (...args: Array<any>) => {
      return (args.length > 1) ? out._n(args) : out._n(args[0]);
    };
    this.node.addListener(this.eventName, this.listener);
  }

  _stop() {
    this.node.removeListener(this.eventName, this.listener);
    this.listener = null;
  }
}

function isEmitter(element: any): boolean {
  return element.emit && element.addListener;
}

/**
 * Creates a stream based on either:
 * - DOM events with the name `eventName` from a provided target node
 * - Events with the name `eventName` from a provided NodeJS EventEmitter
 *
 * When creating a stream from EventEmitters, if the source event has more than
 * one argument all the arguments will be aggregated into an array in the
 * result stream.
 *
 * Marble diagram:
 *
 * ```text
 *   fromEvent(element, eventName)
 * ---ev--ev----ev---------------
 * ```
 *
 * Examples:
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
 * ```js
 * import fromEvent from 'xstream/extra/fromEvent'
 * import {EventEmitter} from 'events'
 *
 * const MyEmitter = new EventEmitter()
 * const stream = fromEvent(MyEmitter, 'foo')
 *
 * stream.addListener({
 *   next: i => console.log(i),
 *   error: err => console.error(err),
 *   complete: () => console.log('completed')
 * })
 *
 * MyEmitter.emit('foo', 'bar')
 * ```
 *
 * ```text
 * > 'bar'
 * ```
 *
 * ```js
 * import fromEvent from 'xstream/extra/fromEvent'
 * import {EventEmitter} from 'events'
 *
 * const MyEmitter = new EventEmitter()
 * const stream = fromEvent(MyEmitter, 'foo')
 *
 * stream.addListener({
 *   next: i => console.log(i),
 *   error: err => console.error(err),
 *   complete: () => console.log('completed')
 * })
 *
 * MyEmitter.emit('foo', 'bar', 'baz', 'buzz')
 * ```
 *
 * ```text
 * > ['bar', 'baz', 'buzz']
 * ```
 *
 * @param {EventTarget|EventEmitter} element The element upon which to listen.
 * @param {string} eventName The name of the event for which to listen.
 * @param {boolean?} useCapture An optional boolean that indicates that events of
 * this type will be dispatched to the registered listener before being
 * dispatched to any EventTarget beneath it in the DOM tree. Defaults to false.
 * @return {Stream}
 */
export default function fromEvent(element: EventTarget | EventEmitter,
                                  eventName: string,
                                  useCapture: boolean = false): Stream<Event|any> {
  if (isEmitter(element)) {
    return new Stream<any>(new NodeEventProducer(element as EventEmitter, eventName));
  } else {
    return new Stream<Event>(new DOMEventProducer(element as EventTarget, eventName, useCapture));
  }
}
