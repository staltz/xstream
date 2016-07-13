import { Subscribable, Subscription, Listener } from '../interfaces';
export declare type ReplaceErrorFn<T> = (err: any) => Subscribable<T>;
export declare class ReplaceErrorOperator<T> implements Subscribable<T> {
    private f;
    _subscribable: Subscribable<T>;
    _subscription: Subscription;
    constructor(f: ReplaceErrorFn<T>, _subscribable: Subscribable<T>);
    subscribe(listener: Listener<T>): Subscription;
}
