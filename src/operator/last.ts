import { Subscribable, Listener, Subscription } from '../interfaces'

export class LastOperator<T> implements Subscribable<T> {
  constructor (public _subscribable: Subscribable<T>) {}

  subscribe (listener: Listener<T>): Subscription {
    return this._subscribable.subscribe(new LastListener<T>(listener))
  }
}

class LastListener<T> implements Listener<T> {
  private value: T = void 0
  private has: boolean = false
  constructor (private listener: Listener<T>) {}

  next (x: T) {
    this.has = true
    this.value = x
  }

  error (e: any) { this.listener.error(e) }

  complete () {
    if (this.has) {
      this.listener.next(this.value)
    }

    this.listener.complete()
  }
}
