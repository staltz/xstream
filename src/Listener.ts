export interface Listener<T> {
  next: (x: T) => void;
  error: (err: any) => void;
  end: () => void;
}
