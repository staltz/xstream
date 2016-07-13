import { Subscribable, Subscription, Listener } from '../interfaces'

export type FoldFn<T, R> = (accumulated: R, value: T) => R

export class FoldOperator<T, R> implements Subscribable<R> {
  constructor (private f: FoldFn<T, R>, private seed: R,
               public _subscribable: Subscribable<T>) {}

  subscribe (listener: Listener<R>): Subscription {
    listener.next(this.seed)
    return this._subscribable.subscribe(new FoldListener<T, R>(this.f, this.seed, listener))
  }
}

class FoldListener<T, R> implements Listener<T> {
  constructor (private f: FoldFn<T, R>, private seed: R,
               private listener: Listener<R>) {}

  next (x: T) {
    const { f } = this
    this.seed = f(this.seed, x)
    this.listener.next(this.seed)
  }

  error (e: any) {
    this.listener.error(e)
  }

  complete () {
    this.listener.complete()
  }
}
