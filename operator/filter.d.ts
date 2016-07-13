import { Subscribable, Listener, Subscription } from '../interfaces';
export declare type Predicate<T> = (x: T) => boolean;
export declare class FilterOperator<T> implements Subscribable<T> {
    private predicate;
    _subscribable: Subscribable<T>;
    constructor(predicate: Predicate<T>, _subscribable: Subscribable<T>);
    subscribe(listener: Listener<T>): Subscription;
}
