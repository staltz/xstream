import { Subscribable, Subscription, Listener } from '../interfaces'

export class StartWithOperator<T> implements Subscribable<T> {
  constructor (private value: T, public _subscribable: Subscribable<T>) {}

  subscribe (listener: Listener<T>): Subscription {
    listener.next(this.value)
    return this._subscribable.subscribe(listener)
  }
}
