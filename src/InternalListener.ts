export interface InternalListener<T> {
  _n: (v: T) => void;
  _e: (err: any) => void;
  _c: () => void;
}
