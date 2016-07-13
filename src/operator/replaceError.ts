import { Subscribable, Subscription, Listener } from '../interfaces'

export type ReplaceErrorFn<T> = (err: any) => Subscribable<T>

export class ReplaceErrorOperator<T> implements Subscribable<T> {
  public _subscription: Subscription = void 0
  constructor (private f: ReplaceErrorFn<T>, public _subscribable: Subscribable<T>) {}

  subscribe (listener: Listener<T>): Subscription {
    return new ReplaceErrorSubscription<T>(this.f, this._subscribable, listener)
  }
}

class ReplaceErrorSubscription<T> implements Subscription, Listener<T> {
  private subscription: Subscription
  constructor (private f: ReplaceErrorFn<T>, subscribable: Subscribable<T>,
               private listener: Listener<T>) {
    this.subscription = subscribable.subscribe(this)
  }

  next (x: T) {
    this.listener.next(x)
  }

  error (e: any) {
    this.subscription.unsubscribe()
    const { f } = this
    this.subscription = f(e).subscribe(this)
  }

  complete () {
    this.listener.complete()
  }

  unsubscribe () {
    this.subscription.unsubscribe()
  }
}
