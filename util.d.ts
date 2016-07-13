export declare function append<T>(x: T, a: T[]): T[];
export declare function remove<T>(i: number, a: T[]): T[];
export declare function findIndex<T>(x: T, a: T[]): number;
export declare function copy<T>(a: T[]): T[];
export declare function forEach<T>(f: (x: T, i?: number) => any, a: T[] | ArrayLike<T>): void;
