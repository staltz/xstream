import { Subscribable, Subscription, Listener } from '../interfaces';
export declare class StartWithOperator<T> implements Subscribable<T> {
    private value;
    _subscribable: Subscribable<T>;
    constructor(value: T, _subscribable: Subscribable<T>);
    subscribe(listener: Listener<T>): Subscription;
}
