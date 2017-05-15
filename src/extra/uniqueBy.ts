import { Stream, Operator } from '../index';

type Serializer<T> = (a: T) => any;

class UniqueByOperator<T> implements Operator<T, T> {
  public type = 'uniqueBy';
  public out: Stream<T> = null as any;
  private c: Set<any> = new Set();

  constructor(
    public s: Serializer<T>,
    public ins: Stream<T>
  ) { }

  _start(out: Stream<T>) {
    this.out = out;
    this.ins._add(this);
  }

  _stop() {
    this.ins._remove(this);
    this.out = null as any;
  }

  _n(a: T) {
    const u = this.out;
    const c = this.c;
    const sa = this.s(a);
    if (!u) return;
    if (!c.has(sa)) {
      u._n(a);
      c.add(sa);
    }
  }

  _e(e: any) {
    const u = this.out;
    if (!u) return;
    u._e(e);
  }

  _c() {
    const u = this.out;
    if (!u) return;
    u._c();
  }
}

/**
* Emits only unique items with uniqueness determined by a passed function
*
* Marble diagram:
*
* ```text
* --{id: 1}--{id: 2}--{id: 3}--{id: 4}--{id: 3}--{id: 2}--{id: 1}--{id: 5}|
*  uniqueBy(o => o.id)
* --{id: 1}--{id: 2}--{id: 3}--{id: 4}-----------------------------{id: 5}|
* ```
*
* Example:
*
* ```js
* import uniqueBy from 'xstream/extra/uniqueBy';
* 
* const head = (a) => a[0];
* const source = xs.of([1], [2], [3], [4], [3], [2], [1], [5]);
* const result = source.compose(uniqueBy(head));
*
* result.addListener({
*   next: a => console.log(a),
*   error: err => console.error(err),
*   complete: () => console.log('completed')
* });
* ```
*
* Result:
*
* ```text
* [1]
* [2]
* [3]
* [4]
* [5]
* completed
* ```
*
* @param {Function} serializer Function to determine uniqueness
* split the output stream.
* @return {Stream}
*/
export default function uniqueBy<T>(s: (a: T) => any) {
  return function (ins: Stream<T>): Stream<T> {
    return new Stream<T>(new UniqueByOperator<T>(s, ins));
  };
}
    