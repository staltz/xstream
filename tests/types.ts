import xs from '../src/index';

// can be used as type
type T = xs<any>;

// check Stream<T> covariant on T
const n$ = xs.create<number>();
const ns$: xs<number | string> = n$;
