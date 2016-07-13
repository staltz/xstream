import { Subscribable, Subscription, Listener } from '../interfaces';
export declare class FlattenOperator<T> implements Subscribable<T> {
    _subscribable: Subscribable<Subscribable<T>>;
    constructor(_subscribable: Subscribable<Subscribable<T>>);
    subscribe(listener: Listener<T>): Subscription;
}
