import { Subscribable, Listener, Subscription } from '../interfaces'

export class DropOperator<T> implements Subscribable<T> {
  constructor (private amount: number, public _subscribable: Subscribable<T>) {}

  subscribe (listener: Listener<T>): Subscription {
    return this._subscribable.subscribe(new DropListener<T>(this.amount, listener))
  }
}

class DropListener<T> implements Listener<T> {
  constructor (private amount: number, private listener: Listener<T>) {}

  next (x: T) {
    if (--this.amount < 0) this.listener.next(x)
  }

  error (e: any) { this.listener.error(e) }
  complete () { this.listener.complete() }
}
