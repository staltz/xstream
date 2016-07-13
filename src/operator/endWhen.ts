import { Subscribable, Subscription, Listener } from '../interfaces'
import { forEach } from '../util'

export class EndWhenOperator<T> implements Subscribable<T> {
  constructor (private signal: Subscribable<any>, public _subscribable: Subscribable<T>) {}

  subscribe (listener: Listener<T>) {
    const subscription = this._subscribable.subscribe(listener)
    const signal = this.signal.subscribe(new EndWhenListener(listener, subscription))
    return new EndWhenSubscription(subscription, signal)
  }
}

class EndWhenListener<T> implements Listener<T> {
  constructor (private listener: Listener<T>, private subscription: Subscription) {}

  next (x: T) {
    this.subscription.unsubscribe()
    this.listener.complete()
  }

  error (e: any) {
    this.subscription.unsubscribe()
    this.listener.error(e)
  }

  complete () {
    this.subscription.unsubscribe()
    this.listener.complete()
  }
}

export class EndWhenSubscription implements Subscription {
  private subscriptions: Subscription[]
  constructor (...subscriptions: Subscription[]) {
    this.subscriptions = subscriptions
  }

  unsubscribe () {
    forEach<Subscription>(unsubscribe, this.subscriptions)
  }
}

function unsubscribe (sub: Subscription) {
  sub.unsubscribe()
}
