import { Subscribable, Listener, Subscription } from '../interfaces'

export class MapOperator<T, R> implements Subscribable<R> {
  constructor (private project: (x: T) => R, public _subscribable: Subscribable<T>) {}

  subscribe (listener: Listener<R>): Subscription {
    return this._subscribable.subscribe(new MapListener<T, R>(this.project, listener))
  }
}

class MapListener <T, R> implements Listener<T> {
  constructor (private project: (x: T) => R, private listener: Listener<R>) {}

  next (x: T) {
    const f = this.project
    this.listener.next(f(x))
  }

  error (e: any) { this.listener.error (e) }
  complete () { this.listener.complete() }
}
