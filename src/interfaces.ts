export interface Subscribable<T> {
  subscribe (listener: Listener<T>): Subscription
}

export interface Operator<T, R> extends Subscribable<R> {
  subscribable: Subscribable<T>
}

export interface Listener<T> {
  next (x: T): void
  error (e: any): void
  complete (): void
}

export interface Subscription {
  unsubscribe (): void
}
