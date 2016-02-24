export interface Observer<T> {
  next: (x: T) => void;
  error: (err: any) => void;
  complete: () => void;
}

export interface Machine<T> {
  start: (observer: Observer<T>) => void;
  stop: () => void;
}

export class Stream<T> implements Observer<T> {
  public observers: Array<Observer<T>>;

  constructor(public machine: Machine<T>) {
    this.observers = [];
  }

  next(x: T): void {
    const len = this.observers.length;
    for (let i = len - 1; i >= 0; i--) {
      this.observers[i].next(x);
    }
  }

  error(err: any): void {
    const len = this.observers.length;
    for (let i = len - 1; i >= 0; i--) {
      this.observers[i].error(err);
    }
  }

  complete(): void {
    const len = this.observers.length;
    for (let i = len - 1; i >= 0; i--) {
      this.observers[i].complete();
    }
  }

  subscribe(observer: Observer<T>): void {
    this.observers.push(observer);
    if (this.observers.length === 1) this.machine.start(this);
  }

  unsubscribe(observer: Observer<T>): void {
    const i = this.observers.indexOf(observer);
    if (i > -1) {
      this.observers.splice(i, 1);
      if (!this.observers.length) this.machine.stop();
    }
  }
}

class IntervalMachine implements Machine<number> {
  on: boolean;
  intervalID: any;
  i: number;

  constructor(public period: number) {
    this.intervalID = -1;
    this.i = 0;
  }

  start(observer: Observer<number>): void {
    this.intervalID = setInterval(() => observer.next(this.i++), this.period);
  }

  stop(): void {
    this.i = 0;
    if (this.intervalID !== -1) clearInterval(this.intervalID);
  }
}

export function interval(period: number) {
  const intervalMachine = new IntervalMachine(period);
  return new Stream<number>(intervalMachine);
}

export default {
  interval
};
