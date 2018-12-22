import {EventEmitter} from 'events';
import {Stream, InternalProducer, InternalListener} from '../index';

export class DOMEventProducer implements InternalProducer<Event> {
  public type = 'fromEvent';
  private listener?: EventListener | null;

  constructor(private node: EventTarget,
              private eventType: string,
              private useCapture: boolean) {
  }

  _start(out: InternalListener<Event>) {
    this.listener = (e) => out._n(e);
    this.node.addEventListener(this.eventType, this.listener, this.useCapture);
  }

  _stop() {
    this.node.removeEventListener(this.eventType, this.listener as any, this.useCapture);
    this.listener = null;
  }
}

export class NodeEventProducer implements InternalProducer<any> {
  public type = 'fromEvent';
  private listener?: Function | null;

  constructor(private node: EventEmitter, private eventName: string) { }

  _start(out: InternalListener<any>) {
    this.listener = (...args: Array<any>) => {
      return (args.length > 1) ? out._n(args) : out._n(args[0]);
    };
    this.node.addListener(this.eventName, this.listener);
  }

  _stop() {
    this.node.removeListener(this.eventName, this.listener as any);
    this.listener = null;
  }
}

function isEmitter(element: any): element is EventEmitter {
  return element.emit && element.addListener;
}

function fromEvent<T = any>(element: EventEmitter, eventName: string): Stream<T>;
function fromEvent<T extends Event = Event>(element: EventTarget, eventName: string, useCapture?: boolean): Stream<T>;

/**
 * Creates a stream based on either:
 * - DOM events with the name `eventName` from a provided target node
 * - Events with the name `eventName` from a provided NodeJS EventEmitter
 *
 * When creating a stream from EventEmitters, if the source event has more than
 * one argument all the arguments will be aggregated into an array in the
 * result stream.
 *
 * (Tip: when using this factory with TypeScript, you will need types for
 * Node.js because fromEvent knows how to handle both DOM events and Node.js
 * EventEmitter. Just install `@types/node`)
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
 * @factory true
 * @param {EventTarget|EventEmitter} element The element upon which to listen.
 * @param {string} eventName The name of the event for which to listen.
 * @param {boolean?} useCapture An optional boolean that indicates that events of
 * this type will be dispatched to the registered listener before being
 * dispatched to any EventTarget beneath it in the DOM tree. Defaults to false.
 * @return {Stream}
 */
function fromEvent<T = any>(element: EventEmitter | EventTarget,
                            eventName: string,
                            useCapture: boolean = false): Stream<T> {
  if (isEmitter(element)) {
    return new Stream<T>(new NodeEventProducer(element, eventName));
  } else {
    return new Stream<T>(new DOMEventProducer(element, eventName, useCapture) as any);
  }
}

export default fromEvent;
