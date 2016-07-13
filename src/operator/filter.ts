import { Subscribable, Listener, Subscription } from '../interfaces'

export type Predicate<T> = (x: T) => boolean

export class FilterOperator<T> implements Subscribable<T> {
  constructor (private predicate: Predicate<T>,
               public _subscribable: Subscribable<T>) {}

  subscribe (listener: Listener<T>): Subscription {
    return this._subscribable.subscribe(new FilterListener(this.predicate, listener))
  }
}

class FilterListener<T> implements Listener<T> {
  constructor (private predicate: Predicate<T>, private listener: Listener<T>) {}

  next (x: T) {
    const { predicate, listener } = this
    if (predicate(x)) listener.next(x)
  }

  error (e: any) { this.listener.error(e) }
  complete () { this.listener.complete() }
}
