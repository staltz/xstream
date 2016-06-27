# Extra operators and factories

The following are standalone stream operators and stream factories that may be separately imported and utilized in your project.
To use an extra operator (e.g. `delay`), import it as such:

```js
import xs from 'xstream'
import delay from 'xstream/extra/delay'

const inputStream = xs.of(1, 2, 3, 4)
const outputStream = inputStream.compose(delay(500))
```

To import and use an extra factory (e.g. `fromEvent`), import it as such:

```js
import fromEvent from 'xstream/extra/fromEvent'

const clickStream = fromEvent(document, 'click')
```

- - -

### <a id="concat"></a> `concat(stream1, stream2)`

Puts one stream after the other. *concat* is a factory that takes multiple
streams as arguments, and starts the `n+1`-th stream only when the `n`-th
stream has completed. It concatenates those streams together.

Marble diagram:

```text
--1--2---3---4-|
...............--a-b-c--d-|
          concat
--1--2---3---4---a-b-c--d-|
```

Example:

```js
import concat from 'xstream/extra/concat'

const streamA = xs.of('a', 'b', 'c')
const streamB = xs.of(10, 20, 30)
const streamC = xs.of('X', 'Y', 'Z')

const outputStream = concat(streamA, streamB, streamC)

outputStream.addListener({
  next: (x) => console.log(x),
  error: (err) => console.error(err),
  complete: () => console.log('concat completed'),
})
```

#### Arguments:

- `stream1: Stream` A stream to concatenate together with other streams.
- `stream2: Stream` A stream to concatenate together with other streams. Two or more streams may be given as arguments.

#### Returns:  Stream 

- - -

### <a id="flattenConcurrently"></a> `flattenConcurrently()`

Flattens a "stream of streams", handling multiple concurrent nested streams
simultaneously.

If the input stream is a stream that emits streams, then this operator will
return an output stream which is a flat stream: emits regular events. The
flattening happens concurrently. It works like this: when the input stream
emits a nested stream, *flattenConcurrently* will start imitating that
nested one. When the next nested stream is emitted on the input stream,
*flattenConcurrently* will also imitate that new one, but will continue to
imitate the previous nested streams as well.

Marble diagram:

```text
--+--------+---------------
  \        \
   \       ----1----2---3--
   --a--b----c----d--------
    flattenConcurrently
-----a--b----c-1--d-2---3--
```

#### Returns:  Stream 

- - -

### <a id="flattenSequentially"></a> `flattenSequentially()`

Flattens a "stream of streams", handling only one nested stream at a time,
with no concurrency, but does not drop nested streams like `flatten` does.

If the input stream is a stream that emits streams, then this operator will
return an output stream which is a flat stream: emits regular events. The
flattening happens sequentially and without concurrency. It works like this:
when the input stream emits a nested stream, *flattenSequentially* will start
imitating that nested one. When the next nested stream is emitted on the
input stream, *flattenSequentially* will keep that in a buffer, and only
start imitating it once the previous nested stream completes.

In essence, `flattenSequentially` concatenates all nested streams.

Marble diagram:

```text
--+--------+-------------------------
  \        \
   \       ----1----2---3--|
   --a--b----c----d--|
         flattenSequentially
-----a--b----c----d------1----2---3--
```

#### Returns:  Stream 

- - -

### <a id="fromDiagram"></a> `fromDiagram(diagram, options)`

Creates a real stream out of an ASCII drawing of a stream. Each string
character represents an amount of time passed (by default, 20 milliseconds).
`-` characters represent nothing special, `|` is a symbol to mark the
completion of the stream, `#` is an error on the stream, and any other
character is a "next" event.

Example:

```js
import fromDiagram from 'xstream/extra/fromDiagram'

const stream = fromDiagram('--a--b---c-d--|')

stream.addListener({
  next: (x) => console.log(x),
  error: (err) => console.error(err),
  complete: () => console.log('concat completed'),
})
```

The character `a` represent emission of the event `'a'`, a string. If you
want to emit something else than a string, you need to provide those values
in the options argument.

Example:

```js
import fromDiagram from 'xstream/extra/fromDiagram'

const stream = fromDiagram('--a--b---c-d--|', {
  values: {a: 10, b: 20, c: 30, d: 40}
})

stream.addListener({
  next: (x) => console.log(x),
  error: (err) => console.error(err),
  complete: () => console.log('concat completed'),
})
```

That way, the stream will emit the numbers 10, 20, 30, 40. The `options`
argument may also take `timeUnit`, a number to configure how many
milliseconds does each represents, and `errorValue`, a value to send out as
the error which `#` represents.

#### Arguments:

- `diagram: string` A string representing a timeline of values, error, or complete notifications that should happen on the output stream.
- `options` An options object that allows you to configure some additional details of the creation of the stream.

#### Returns:  Stream 

- - -

### <a id="debounce"></a> `debounce(period)`

Delays events until a certain amount of silence has passed.
If that timespan of silence is not met the event is dropped.

Marble diagram:

```text
--1----2--3--4----5|
    debounce(150)
----1----------4-----|
```

Example:

```js
import debounce from 'xstream/extra/debounce';
import delay from 'xstream/extra/delay';
import flattenConcurrently from 'xstream/extra/flattenConcurrently';

var schedule = [
    { value: 0, time: 100 },
    { value: 1, time: 400 },
    { value: 2, time: 500 },
    { value: 3, time: 600 },
    { value: 4, time: 900 }
];


const stream = xs
                .fromArray(schedule)
                .map(item => xs
                               .of(item.value)
                               .compose(delay(item.time)))
                .compose(flattenConcurrently)
                .compose(debounce(150))

stream
  .addListener({
    next: i => console.log(i),
    error: err => console.error(err),
    complete: () => console.log('completed')
})

// => Next: 0
// => Next: 3
// => completed
```

#### Arguments:

- `period: number` The amount of silence required in miliseconds

#### Returns:  Stream

- - -

### <a id="delay"></a> `delay(period)`

Delays periodic events by a given time period.


Marble diagram:

```text
--1----2--3--4----5|
    delay(300)
-----1----2--3--4----5|
```

Example:

```js

import delay from 'xstream/extra/delay';
import flattenConcurrently from 'xstream/extra/flattenConcurrently';

var schedule = [
    { value: 0, time: 100 },
    { value: 1, time: 400 },
    { value: 2, time: 500 },
    { value: 3, time: 600 },
    { value: 4, time: 900 }
];


const stream = xs
                .fromArray(schedule)
                .map(item => xs
                               .of(item.value)
                               .compose(delay(item.time)))
                .compose(flattenConcurrently)

stream
  .addListener({
    next: i => console.log(i),
    error: err => console.error(err),
    complete: () => console.log('completed')
})

// => Next: 0  (after 100 ms)
// => Next: 1  (after 400 ms)
// => Next: 2  (after 500 ms)
// => Next: 3  (after 600 ms)
// => Next: 4  (after 900 ms)
// => completed
```

#### Arguments:

- `period: number` The amount of time to delay events in miliseconds

#### Returns:  Stream

- - -

### <a id="dropRepeats"></a> `dropRepeats(isEqual)`

Drops consecutive duplicate values in a stream.


Marble diagram:

```text
--1--2--1--1--1--2--3--4--3--3|
    dropRepeats
--1--2--1--------2--3--4--3---|
```

Example:

```js
import dropRepeats from 'xstream/extra/dropRepeats';

const stream = xs.of(1, 2, 1, 1, 1, 2, 3, 4, 3, 3)
                 .compose(dropRepeats());

stream.addListener({
    next: i => console.log(i),
    error: err => console.error(err),
    complete: () => console.log('completed')
})

// => Next: 1
// => Next: 2
// => Next: 1
// => Next: 2
// => Next: 3
// => Next: 4
// => Next: 3
// => completed


// with custom isEqual function
const stream = xs.of('a', 'b', 'a', 'A', 'B', 'b')
                 .compose(dropRepeats((x, y) => x.toLowerCase() === y.toLowerCase()));

stream
  .addListener({
    next: i => console.log(i),
    error: err => console.error(err),
    complete: () => console.log('completed')
})

// => Next: a
// => Next: b
// => Next: a
// => Next: B
// => completed

```

#### Arguments:

- `isEqual: Function` An optional custom isEqual function of type `(t: T) => boolean` that takes an event from the input stream and checks if it is equal to previous event, by returning a boolean.

#### Returns:  Stream

- - -

### <a id="dropUntil"></a> `dropUntil(stream)`

Starts emitting the stream when another stream emits next. The stream completes the stream if/when the other stream emits complete


Marble diagram:

```text
---1---2-----3--4----5----6---
  dropUntil( --------a--b--| )
---------------------5----6|
```

Example:

```js
import dropUntil from 'xstream/extra/dropUntil'

const other = xs.periodic(220).take(1)

const stream = xs.periodic(50)
                 .take(6)
                 .compose(dropUntil(other))

stream
  .addListener({
    next: i => console.log(i),
    error: err => console.error(err),
    complete: () => console.log('completed')
})

// => Next: 4
// => Next: 5
// => completed
```

#### Arguments:

- `other` Some other stream that is used to know when should the output stream of this operator should start emitting

#### Returns:  Stream

- - -

### <a id="fromEvent"></a> `fromEvent(target, eventType, capture)`

Creates a stream based on events of type eventType from the target.


Marble diagram:

```text
---c---c-----c-------------
  fromEvent
---ev--ev----ev-------------
```

Example:

```js
import fromEvent from 'xstream/extra/fromEvent'

const stream = fromEvent(document.querySelector('.button'), 'click')
                .map(ev => 'Button clicked!')

stream
  .addListener({
    next: i => console.log(i),
    error: err => console.error(err),
    complete: () => console.log('completed')
})

// => 'Button clicked!'
// => 'Button clicked!'
// => 'Button clicked!'
```

#### Arguments:

- `target` The element we want to listen to.
- `eventType` The type of events we want to listen to.
- `capture` An optional boolean that indicates that events of this type will be dispatched to the registered listener before being dispatched to any EventTarget beneath it in the DOM tree. Defaults to false.

#### Returns:  Stream

- - -

### <a id="pairwise"></a> `pairwise()`

Group consecutive pairs as arrays.


Marble diagram:

```text
---1---2-----3-----4-----5----------|
      pairwise
-------[1,2]-[2,3]-[3,4]-[4,5]------|
```

Example:

```js
import pairwise from 'xstream/extra/pairwise'

const stream = xs.of(1, 2, 3, 4, 5, 6).compose(pairwise);

stream
  .addListener({
    next: i => console.log(i),
    error: err => console.error(err),
    complete: () => console.log('completed')
})

// => [1,2]
// => [2,3]
// => [3,4]
// => [4,5]
// => [5,6]
// => completed
```

#### Returns:  Stream

- - -

### <a id="split"></a> `split(separator)`

Splits a stream using a separator stream.


Marble diagram:

```text
--1--2--3--4--5--6--7--8--9|
 split( --1----2--- )
---------------------------|
  :        :     :
  1--2--3-|:     :
           4--5| :
                 6--7--8--9|

```

Example:

```js
import split from 'xstream/extra/split'
import concat from 'xstream/extra/concat'

const source = xs.periodic(50).take(10);
const separator = concat(xs.periodic(167).take(2), xs.never());
const metastream = source.compose(split(separator))


metastream
  .addListener({
    next: stream => {
          stream.addListener({
              next: i => console.log(i),
              error: err => console.error(err),
              complete: () => console.log('inner completed')
          })
    },
    error: err => console.error(err),
    complete: () => console.log('outer completed')
})

// => 0
// => 1
// => 2
// => inner completed
// => 3
// => 4
// => 5
// => inner completed
// => 6
// => 7
// => 8
// => 9
// => inner completed
// => outer completed
```

#### Arguments:

- `separator` Some other stream that is used to know when to split the output stream

#### Returns:  Metastream

- - -
