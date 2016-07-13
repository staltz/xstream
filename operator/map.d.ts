import { Subscribable, Listener, Subscription } from '../interfaces';
export declare class MapOperator<T, R> implements Subscribable<R> {
    private project;
    _subscribable: Subscribable<T>;
    constructor(project: (x: T) => R, _subscribable: Subscribable<T>);
    subscribe(listener: Listener<R>): Subscription;
}
