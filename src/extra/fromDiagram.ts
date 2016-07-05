import {Stream, InternalProducer, InternalListener} from '../core';

export interface FromDiagramOptions {
  values?: Object;
  errorValue?: any;
  timeUnit?: number;
}

interface Notification {
  type: 'next' | 'error' | 'complete';
  value?: any;
  time: number;
}

export class DiagramProducer implements InternalProducer<any> {
  private diagram: string;
  private values: Object;
  private errorVal: any;
  private timeUnit: number;
  private tasks: Array<any>;

  constructor(diagram: string,
              opt?: FromDiagramOptions) {
    this.diagram = diagram.trim();
    this.errorVal = (opt && opt.errorValue) ? opt.errorValue : '#';
    this.timeUnit = (opt && opt.timeUnit) ? opt.timeUnit : 20;
    this.values = (opt && opt.values) ? opt.values : {};
    this.tasks = [];
  }

  _start(out: InternalListener<any>) {
    const L = this.diagram.length;
    for (let i = 0; i < L; i++) {
      const c = this.diagram[i];
      const time = this.timeUnit * i;
      switch (c) {
        case '-':
          break;
        case '#':
          this.schedule({type: 'error', value: this.errorVal, time: time}, out);
          break;
        case '|':
          this.schedule({type: 'complete', time: time}, out);
          break;
        default:
          const val = this.values.hasOwnProperty(c) ? this.values[c] : c;
          this.schedule({type: 'next', value: val, time: time}, out);
          break;
      }
    }
  }

  private schedule(notification: Notification, out: InternalListener<any>) {
    const id = setInterval(() => {
      switch (notification.type) {
        case 'next':
          out._n(notification.value);
          break;
        case 'error':
          out._e(notification.value);
          break;
        case 'complete':
          out._c();
          break;
      }
      clearInterval(id);
    }, notification.time);
  }

  _stop() {
    this.tasks.forEach(id => clearInterval(id));
  }
}

/**
 * Creates a real stream out of an ASCII drawing of a stream. Each string
 * character represents an amount of time passed (by default, 20 milliseconds).
 * `-` characters represent nothing special, `|` is a symbol to mark the
 * completion of the stream, `#` is an error on the stream, and any other
 * character is a "next" event.
 *
 * Example:
 *
 * ```js
 * import fromDiagram from 'xstream/extra/fromDiagram'
 *
 * const stream = fromDiagram('--a--b---c-d--|')
 *
 * stream.addListener({
 *   next: (x) => console.log(x),
 *   error: (err) => console.error(err),
 *   complete: () => console.log('concat completed'),
 * })
 * ```
 *
 * The character `a` represent emission of the event `'a'`, a string. If you
 * want to emit something else than a string, you need to provide those values
 * in the options argument.
 *
 * Example:
 *
 * ```js
 * import fromDiagram from 'xstream/extra/fromDiagram'
 *
 * const stream = fromDiagram('--a--b---c-d--|', {
 *   values: {a: 10, b: 20, c: 30, d: 40}
 * })
 *
 * stream.addListener({
 *   next: (x) => console.log(x),
 *   error: (err) => console.error(err),
 *   complete: () => console.log('concat completed'),
 * })
 * ```
 *
 * That way, the stream will emit the numbers 10, 20, 30, 40. The `options`
 * argument may also take `timeUnit`, a number to configure how many
 * milliseconds does each represents, and `errorValue`, a value to send out as
 * the error which `#` represents.
 *
 * @factory true
 * @param {string} diagram A string representing a timeline of values, error,
 * or complete notifications that should happen on the output stream.
 * @param options An options object that allows you to configure some additional
 * details of the creation of the stream.
 * @return {Stream}
 */
export default function fromDiagram(diagram: string, options?: FromDiagramOptions): Stream<any> {
  return new Stream<any>(new DiagramProducer(diagram, options));
}
