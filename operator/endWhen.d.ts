import { Subscribable, Subscription, Listener } from '../interfaces';
export declare class EndWhenOperator<T> implements Subscribable<T> {
    private signal;
    _subscribable: Subscribable<T>;
    constructor(signal: Subscribable<any>, _subscribable: Subscribable<T>);
    subscribe(listener: Listener<T>): EndWhenSubscription;
}
export declare class EndWhenSubscription implements Subscription {
    private subscriptions;
    constructor(...subscriptions: Subscription[]);
    unsubscribe(): void;
}
