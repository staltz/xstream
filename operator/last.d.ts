import { Subscribable, Listener, Subscription } from '../interfaces';
export declare class LastOperator<T> implements Subscribable<T> {
    _subscribable: Subscribable<T>;
    constructor(_subscribable: Subscribable<T>);
    subscribe(listener: Listener<T>): Subscription;
}
