import { Subscribable, Subscription, Listener } from '../interfaces';
export declare type FoldFn<T, R> = (accumulated: R, value: T) => R;
export declare class FoldOperator<T, R> implements Subscribable<R> {
    private f;
    private seed;
    _subscribable: Subscribable<T>;
    constructor(f: FoldFn<T, R>, seed: R, _subscribable: Subscribable<T>);
    subscribe(listener: Listener<R>): Subscription;
}
