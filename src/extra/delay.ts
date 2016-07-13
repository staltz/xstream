import { Subscribable, Subscription, Listener } from '../interfaces'
import { Stream, MemoryStream } from '../core'

import ctor from './ctor'

export default function delay<T> (delayTime: number): ((stream: Stream<T> | MemoryStream<T>) => Stream<T> | MemoryStream<T>) {
  return function delayOperator<T> (stream: Stream<T> | MemoryStream<T>): Stream<T> | MemoryStream<T> {
    const constructor = ctor(stream)
    return new constructor<T>(new DelayOperator<T>(delayTime, stream))
  }
}

class DelayOperator <T> implements Subscribable<T> {
  constructor (private delayTime: number, public _subscribable: Subscribable<T>) {}

  subscribe (listener: Listener<T>): Subscription {
    return this._subscribable.subscribe(new DelayListener<T>(this.delayTime, listener))
  }
}

class DelayListener<T> implements Listener<T> {
  private _stopId: any = -1
  constructor (private delayTime: number, private listener: Listener<T>) {}

  next (x: T) {
    this._stopId = setTimeout(() => this.listener.next(x), this.delayTime)
  }

  error(e: any) {
    if (this._stopId !== -1) clearTimeout(this._stopId)
    this.listener.error(e)
    this._stopId = -1
  }

  complete () {
    if (this._stopId !== -1) clearTimeout(this._stopId)
    this.listener.complete()
    this._stopId = -1
  }
}
