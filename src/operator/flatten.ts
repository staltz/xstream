import { Subscribable, Subscription, Listener } from '../interfaces'

export class FlattenOperator<T> implements Subscribable<T> {
  constructor (public _subscribable: Subscribable<Subscribable<T>>) {}

  subscribe (listener: Listener<T>): Subscription {
    let sub: Subscription = void 0
    return this._subscribable.subscribe({
      next: (value: Subscribable<T>) => {
        if (sub) sub.unsubscribe()
        sub = value.subscribe(listener)
      },
      error (err: any) {
        listener.error(err)
      },
      complete () {
        listener.complete()
      }
    })
  }
}
