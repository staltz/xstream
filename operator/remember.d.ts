import { Subscribable, Subscription, Listener } from '../interfaces';
export declare class RememberOperator<T> implements Subscribable<T> {
    private _subscribable;
    constructor(_subscribable: Subscribable<T>);
    subscribe(listener: Listener<T>): Subscription;
}
