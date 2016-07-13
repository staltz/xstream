import { Subscribable, Subscription, Listener } from '../interfaces'

export class RememberOperator<T> implements Subscribable<T> {
  constructor (private _subscribable: Subscribable<T>) {}

  subscribe (listener: Listener<T>): Subscription {
    return this._subscribable.subscribe(listener)
  }
}
