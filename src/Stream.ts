import {Observer} from './Observer';
import {Machine} from './Machine';
import {MapMachine} from './operator/MapMachine';
import {FilterMachine} from './operator/FilterMachine';
import {TakeMachine} from './operator/TakeMachine';

export class Stream<T> implements Observer<T> {
  public observers: Array<Observer<T>>;
  public num: number; // Number of non-operator subscribers

  constructor(public machine: Machine<T>) {
    this.observers = [];
    this.num = 0;
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
    if (++this.num === 1) this.machine.start(this);
  }

  unsubscribe(observer: Observer<T>): void {
    const i = this.observers.indexOf(observer);
    if (i > -1) {
      this.observers.splice(i, 1);
      if (--this.num <= 0) this.machine.stop();
    }
  }

  map<U>(projection: (t: T) => U): Stream<U> {
    return new Stream<U>(new MapMachine(projection, this));
  }

  filter(predicate: (t: T) => boolean): Stream<T> {
    return new Stream<T>(new FilterMachine(predicate, this));
  }

  take(amount: number): Stream<T> {
    return new Stream<T>(new TakeMachine(amount, this));
  }
}
