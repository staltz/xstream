/// <reference path="../../typings/globals/node/index.d.ts" />
import { EventEmitter } from 'events';
import { Stream, InternalProducer, InternalListener } from '../core';

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

export class NodeEventProducer implements InternalProducer<any> {
  public type = 'fromEvent';
  private listener: Function;

  constructor(private node: EventEmitter, private eventName: string) { }

  _start(out: InternalListener<any>) {
    this.listener = (e: any) => out._n(e);
    const {node, eventName} = this;
    node.addListener(eventName, this.listener);
  }

  _stop() {
    const {node, eventName, listener} = this;
    node.removeListener(eventName, listener);
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
 *   fromEvent( element, eventType )
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
 * });
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
 * import {EventEmitter} from 'events';
 *
 * const MyEmitter = new EventEmitter();
 * const stream = fromEvent( MyEmitter, 'foo' );
 *
 * stream.addListener({
 *   next: i => console.log(i),
 *   error: err => console.error(err),
 *   complete: () => console.log('completed')
 * });
 *
 * MyEmitter.emit( 'foo', 'bar' );
 * ```
 *
 * ```text
 * > 'bar'
 * ```
 *
 * @param {EventTarget|EventEmitter} element The element upon which to listen.
 * @param {string} eventName The name of the event for which to listen.
 * @param {boolean?} useCapture An optional boolean that indicates that events of
 * this type will be dispatched to the registered listener before being
 * dispatched to any EventTarget beneath it in the DOM tree. Defaults to false.
 * @return {Stream}
 */
export default function fromEvent( element: EventTarget | EventEmitter, eventName: string, useCapture: boolean = false): Stream<Event|any> {
  if ( element instanceof EventEmitter ) {
    return new Stream<any>(new NodeEventProducer( element, eventName ));
  } else {
    return new Stream<Event>(new DOMEventProducer( element, eventName, useCapture ));
  }
}
