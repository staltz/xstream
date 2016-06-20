import {Stream, InternalProducer, InternalListener} from '../core';

/**
 * Creates a ColdStream. This gives each new listener added it's own
 * version of the underlying source without sharing values.
 * Note that calling cold() on stream is a 1 time occurence, calling `.map(f)`
 * or any other operator will not return a ColdStream, and will continue to be
 * regular Stream/MemoryStream.
 *
 * Example:
 *
 * import xs from 'xstream'
 * import cold from 'xstream/extra/cold'
 *
 * const stream = xs.periodic(100).take(3).compose(cold)
 *
 * const listener1 = {
 * 	next: x => console.log('Listener 1: ' + x),
 * 	error: err => console.error('Listener 1 error: ' + err),
 * 	complete: () => console.log('Listener 1 complete')
 * }
 *
 * const listener2 = {
 * 	next: x => console.log('Listener 2: ' + x),
 * 	error: err => console.error('Listener 2 error: ' + err),
 * 	complete: () => console.log('Listener 2 complete')
 * }
 *
 * stream.addListener(listener1); // 0, 1, 2
 * setTimeout(() => stream.addListener(listener2), 110); // 0, 1, 2
 * // without using cold the second stream would only log 1 and 2 before completion
 */
export default function cold <T>(stream: Stream<T>): ColdStream<T> {
  return new ColdStream<T>(new ColdProducer<T>(stream._prod));
}

export class ColdStream<T> extends Stream<T> {
  _add (il: InternalListener<T>) {
    const p = this._prod;
    if (p) p._start(il);
  }
}

class ColdProducer<T> implements InternalProducer<T> {
  constructor (private _prod: InternalProducer<T>) {}

  _start (il: InternalListener<T>) {
    this._prod._start(il);
  }

  _stop () {
    this._prod._stop();
  }
}
