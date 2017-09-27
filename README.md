<!-- This README.md is automatically generated from source code and files in the /markdown directory. Please DO NOT send pull requests to directly modify this README. Instead, edit the JSDoc comments in source code or the md files in /markdown/. -->

```text
          _
__  _____| |_ _ __ ___  __ _ _ __ ___
\ \/ / __| __| '__/ _ \/ _` | '_ ` _ \
 >  <\__ \ |_| | |  __/ (_| | | | | | |
/_/\_\___/\__|_|  \___|\__,_|_| |_| |_|
```
<h2 class="site-subtitle">An extremely intuitive, small, and fast<br />functional reactive stream library for JavaScript</h2>

- Only 26 core operators and factories
- Only ["hot"](https://medium.com/@benlesh/hot-vs-cold-observables-f8094ed53339#.mvzg5e7lf) streams
- Written in TypeScript
- Approximately 30 kB in size, when minified
- On average, faster than RxJS 4, Kefir, Bacon.js, as fast as RxJS 5, and slower than most.js
- Tailored for [Cycle.js](http://cycle.js.org), or applications with limited use of `subscribe`

![](https://badge-size.herokuapp.com/staltz/xstream/master/dist/xstream.js.svg)
![](https://badge-size.herokuapp.com/staltz/xstream/master/dist/xstream.min.js.svg?compression=gzip)
[![ComVer](https://img.shields.io/badge/ComVer-compliant-brightgreen.svg)](https://github.com/staltz/comver)
[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg?maxAge=2592000)](https://gitter.im/staltz/xstream)

# Example

```js
import xs from 'xstream'

// Tick every second incremental numbers,
// only pass even numbers, then map them to their square,
// and stop after 5 seconds has passed

var stream = xs.periodic(1000)
  .filter(i => i % 2 === 0)
  .map(i => i * i)
  .endWhen(xs.periodic(5000).take(1))

// So far, the stream is idle.
// As soon as it gets its first listener, it starts executing.

stream.addListener({
  next: i => console.log(i),
  error: err => console.error(err),
  complete: () => console.log('completed'),
})
```

# Installation

```text
npm install xstream
```

# Usage

## ES2015 or TypeScript

```js
import xs from 'xstream'
```

## CommonJS

```js
var xs = require('xstream').default
```

# API

## Factories
- [`create`](#create)
- [`createWithMemory`](#createWithMemory)
- [`never`](#never)
- [`empty`](#empty)
- [`throw`](#throw)
- [`from`](#from)
- [`of`](#of)
- [`fromArray`](#fromArray)
- [`fromPromise`](#fromPromise)
- [`fromObservable`](#fromObservable)
- [`periodic`](#periodic)
- [`merge`](#merge)
- [`combine`](#combine)

## Methods and Operators
- [`addListener`](#addListener)
- [`removeListener`](#removeListener)
- [`subscribe`](#subscribe)
- [`map`](#map)
- [`mapTo`](#mapTo)
- [`filter`](#filter)
- [`take`](#take)
- [`drop`](#drop)
- [`last`](#last)
- [`startWith`](#startWith)
- [`endWhen`](#endWhen)
- [`fold`](#fold)
- [`replaceError`](#replaceError)
- [`flatten`](#flatten)
- [`compose`](#compose)
- [`remember`](#remember)
- [`debug`](#debug)
- [`imitate`](#imitate)
- [`shamefullySendNext`](#shamefullySendNext)
- [`shamefullySendError`](#shamefullySendError)
- [`shamefullySendComplete`](#shamefullySendComplete)
- [`setDebugListener`](#setDebugListener)

## Extra factories and operators

To keep the core of xstream small and simple, less frequently-used methods are available under the `xstream/extra` directory, and must be imported separately. See [EXTRA_DOCS](https://github.com/staltz/xstream/blob/master/EXTRA_DOCS.md) for documentation.

# Overview

XStream has four fundamental types: [Stream](#stream), [Listener](#listener), [Producer](#producer), and [MemoryStream](#memorystream).

## Stream

A Stream is an **event emitter** with multiple Listeners. When an event happens on the
Stream, it is broadcast to all its Listeners at the same time.

Streams have methods attached to them called *operators*, such as `map`, `filter`, `fold`, `take`, etc. When called, an operator creates and returns another Stream. Once the first Stream broadcasts an event, the event will pass through the operator logic and the output Stream may perhaps broadcast its own event based on the source one.

You can also trigger an event to happen on a Stream with the `shamefullySend*` methods. But you don't want to do that. Really, avoid doing that because it's not the reactive way and you'll be missing the point of this library. Ok?

## Listener

A Listener is an object with one to three functions attached to it: `next`, `error`, and `complete`. There is usually one function for each type of event a Stream may emit but only `next` is always required.

- `next` events are the typical type, they deliver a value.
- `error` events abort (stop) the execution of the Stream, and happen when something goes wrong in the Stream (or upstream somewhere in the chain of operators)
- `complete` events signal the peaceful stop of the execution of the Stream.

This is an example of a typical listener:

```js
var listener = {
  next: (value) => {
    console.log('The Stream gave me a value: ', value);
  },
  error: (err) => {
    console.error('The Stream gave me an error: ', err);
  },
  complete: () => {
    console.log('The Stream told me it is done.');
  },
}
```

And this is how you would attach that Listener to a Stream:

<!-- skip-example -->
```js
stream.addListener(listener)
```

And when you think the Listener is done, you can remove it from the Stream:

<!-- skip-example -->
```js
stream.removeListener(listener)
```

## Producer

A Producer is like a machine that produces events to be broadcast on a Stream.

Events from a Stream must come from somewhere, right? That's why we need Producers. They are objects with two functions attached: `start(listener)` and `stop()`. Once you call `start` with a `listener`, the Producer will start generating events and it will send those to the listener. When you call `stop()`, the Producer should quit doing its own thing.

Streams are also Listeners (actually they are "InternalListeners", not Listeners, but that's a detail you can ignore), so you can theoretically give a Stream as the listener in `producer.start(streamAsListener)`. Then, essentially the Producer is now generating events that will be broadcast on the Stream. Nice, huh? Now a bunch of listeners can be attached to the Stream and they can all get those events originally coming from the Producer. That's why `xs.create(producer)` receives a Producer to be the heart of a new Stream. Check this out:

```js
var producer = {
  start: function (listener) {
    this.id = setInterval(() => listener.next('yo'), 1000)
  },

  stop: function () {
    clearInterval(this.id)
  },

  id: 0,
}

// This fellow delivers a 'yo' next event every 1 second
var stream = xs.create(producer)
```

But remember, a Producer has only one listener, but a Stream may have many listeners.

You may wonder "when is `start` and `stop` called", and that's actually a fairly tricky topic, so let's get back to that soon. First let me tell you about MemoryStreams.

## MemoryStream

A MemoryStream is just like a Stream: it has operators, it can have listeners attached, you can shamefully send events to it, blabla. But it has one special property: it has *memory*. It remembers the most recent (but just one) `next` event that it sent to its listeners.

Why is that useful? If a new Listener is added *after* that `next` event was sent, the MemoryStream will get its value stored in memory and will send it to the newly attached Listener.

This is important so MemoryStreams can represent values or pieces of state which are relevant even after some time has passed. You don't want to lose those, you want to keep them and send them to Listeners that arrive late, after the event was originally created.

## How a Stream starts and stops

A Stream controls its Producer according to its number of Listeners, using reference counting with a synchronous `start` and a cancelable asynchronous `stop`. That's how a Stream starts and stops, basically. Usually this part of XStream is not so relevant to remember when building applications, but if you want to understand it for debugging or curiosity, it's explained in plain English below.

When you create a Stream with `xs.create(producer)`, the `start()` function of the Producer is not yet called. The Stream is still "idle". It has the Producer, but the Producer was not turned on.

Once the first Listener is added to the Stream, the number of Listeners attached suddenly changed from `0` to `1`. That's when the Stream calls `start`, because after all there is at least one Listener interested in this Stream.

More Listeners may be added in the future, but they don't affect whether the Producer will continue working or stop. Just the first Listener dictates when the Stream starts.

What matters for stopping the Producer is `stream.removeListener`. When the last Listener leaves (or in other words, when the number of Listeners suddenly changes from `1` to `0`), the Stream schedules `producer.stop()` **to happen on the next event loop**. That is, asynchronously. If, however, a new Listener is added (number goes from `0` to `1`) *before* that scheduled moment, the `producer.stop()` will be cancelled, and the Producer will continue generating events for its Stream normally.

The reason the Producer is not suddenly (synchronously) stopped, is that it is often necessary to swap the single listener of a Stream, but still keep its ongoing execution. For instance:

<!-- skip-example -->
```js
var listenerA = {/* ... */}
var listenerB = {/* ... */}

// number goes from 0 to 1, so the Stream's Producer starts
stream.addListener(listenerA)

// ...

// number goes from 1 to 0, but then immediately goes back
// to 1, because listenerB was added
stream.removeListener(listenerA)
stream.addListener(listenerB)

// Stream's Producer does not stop, everything continues as before
```

It's still useful to eventually (asynchronously) stop a Stream's internal Producer, because you don't want useless computation lying around producing gibberish. At least I don't.

# Factories

Factories are functions that create Streams, such as `xs.create()`, `xs.periodic()`, etc.

### <a id="create"></a> `create(producer)`

Creates a new Stream given a Producer.

#### Arguments:

- `producer: Producer` An optional Producer that dictates how to start, generate events, and stop the Stream.

#### Returns:  Stream 

- - -

### <a id="createWithMemory"></a> `createWithMemory(producer)`

Creates a new MemoryStream given a Producer.

#### Arguments:

- `producer: Producer` An optional Producer that dictates how to start, generate events, and stop the Stream.

#### Returns:  MemoryStream 

- - -

### <a id="never"></a> `never()`

Creates a Stream that does nothing when started. It never emits any event.

Marble diagram:

```text
         never
-----------------------
```

#### Returns:  Stream 

- - -

### <a id="empty"></a> `empty()`

Creates a Stream that immediately emits the "complete" notification when
started, and that's it.

Marble diagram:

```text
empty
-|
```

#### Returns:  Stream 

- - -

### <a id="throw"></a> `throw(error)`

Creates a Stream that immediately emits an "error" notification with the
value you passed as the `error` argument when the stream starts, and that's
it.

Marble diagram:

```text
throw(X)
-X
```

#### Arguments:

- `error` The error event to emit on the created stream.

#### Returns:  Stream 

- - -

### <a id="from"></a> `from(input)`

Creates a stream from an Array, Promise, or an Observable.

#### Arguments:

- `input: Array|PromiseLike|Observable` The input to make a stream from.

#### Returns:  Stream 

- - -

### <a id="of"></a> `of(a, b)`

Creates a Stream that immediately emits the arguments that you give to
*of*, then completes.

Marble diagram:

```text
of(1,2,3)
123|
```

#### Arguments:

- `a` The first value you want to emit as an event on the stream.
- `b` The second value you want to emit as an event on the stream. One or more of these values may be given as arguments.

#### Returns:  Stream 

- - -

### <a id="fromArray"></a> `fromArray(array)`

Converts an array to a stream. The returned stream will emit synchronously
all the items in the array, and then complete.

Marble diagram:

```text
fromArray([1,2,3])
123|
```

#### Arguments:

- `array: Array` The array to be converted as a stream.

#### Returns:  Stream 

- - -

### <a id="fromPromise"></a> `fromPromise(promise)`

Converts a promise to a stream. The returned stream will emit the resolved
value of the promise, and then complete. However, if the promise is
rejected, the stream will emit the corresponding error.

Marble diagram:

```text
fromPromise( ----42 )
-----------------42|
```

#### Arguments:

- `promise: PromiseLike` The promise to be converted as a stream.

#### Returns:  Stream 

- - -

### <a id="fromObservable"></a> `fromObservable(observable)`

Converts an Observable into a Stream.

#### Arguments:

- `observable: any` The observable to be converted as a stream.

#### Returns:  Stream 

- - -

### <a id="periodic"></a> `periodic(period)`

Creates a stream that periodically emits incremental numbers, every
`period` milliseconds.

Marble diagram:

```text
    periodic(1000)
---0---1---2---3---4---...
```

#### Arguments:

- `period: number` The interval in milliseconds to use as a rate of emission.

#### Returns:  Stream 

- - -

### <a id="merge"></a> `merge(stream1, stream2)`

Blends multiple streams together, emitting events from all of them
concurrently.

*merge* takes multiple streams as arguments, and creates a stream that
behaves like each of the argument streams, in parallel.

Marble diagram:

```text
--1----2-----3--------4---
----a-----b----c---d------
           merge
--1-a--2--b--3-c---d--4---
```

#### Arguments:

- `stream1: Stream` A stream to merge together with other streams.
- `stream2: Stream` A stream to merge together with other streams. Two or more streams may be given as arguments.

#### Returns:  Stream 

- - -

### <a id="combine"></a> `combine(stream1, stream2)`

Combines multiple input streams together to return a stream whose events
are arrays that collect the latest events from each input stream.

*combine* internally remembers the most recent event from each of the input
streams. When any of the input streams emits an event, that event together
with all the other saved events are combined into an array. That array will
be emitted on the output stream. It's essentially a way of joining together
the events from multiple streams.

Marble diagram:

```text
--1----2-----3--------4---
----a-----b-----c--d------
         combine
----1a-2a-2b-3b-3c-3d-4d--
```

#### Arguments:

- `stream1: Stream` A stream to combine together with other streams.
- `stream2: Stream` A stream to combine together with other streams. Multiple streams, not just two, may be given as arguments.

#### Returns:  Stream 

- - -


# Methods and Operators

Methods are functions attached to a Stream instance, like `stream.addListener()`. Operators are also methods, but return a new Stream, leaving the existing Stream unmodified, except for the fact that it has a child Stream attached as Listener.

### <a id="addListener"></a> `addListener(listener)`

Adds a Listener to the Stream.

#### Arguments:

- `listener: Listener`

- - -

### <a id="removeListener"></a> `removeListener(listener)`

Removes a Listener from the Stream, assuming the Listener was added to it.

#### Arguments:

- `listener: Listener\<T>`

- - -

### <a id="subscribe"></a> `subscribe(listener)`

Adds a Listener to the Stream returning a Subscription to remove that
listener.

#### Arguments:

- `listener: Listener`

#### Returns:  Subscription 

- - -

### <a id="map"></a> `map(project)`

Transforms each event from the input Stream through a `project` function,
to get a Stream that emits those transformed events.

Marble diagram:

```text
--1---3--5-----7------
   map(i => i * 10)
--10--30-50----70-----
```

#### Arguments:

- `project: Function` A function of type `(t: T) => U` that takes event `t` of type `T` from the input Stream and produces an event of type `U`, to
be emitted on the output Stream.

#### Returns:  Stream 

- - -

### <a id="mapTo"></a> `mapTo(projectedValue)`

It's like `map`, but transforms each input event to always the same
constant value on the output Stream.

Marble diagram:

```text
--1---3--5-----7-----
      mapTo(10)
--10--10-10----10----
```

#### Arguments:

- `projectedValue` A value to emit on the output Stream whenever the input Stream emits any value.

#### Returns:  Stream 

- - -

### <a id="filter"></a> `filter(passes)`

Only allows events that pass the test given by the `passes` argument.

Each event from the input stream is given to the `passes` function. If the
function returns `true`, the event is forwarded to the output stream,
otherwise it is ignored and not forwarded.

Marble diagram:

```text
--1---2--3-----4-----5---6--7-8--
    filter(i => i % 2 === 0)
------2--------4---------6----8--
```

#### Arguments:

- `passes: Function` A function of type `(t: T) => boolean` that takes an event from the input stream and checks if it passes, by returning a
boolean.

#### Returns:  Stream 

- - -

### <a id="take"></a> `take(amount)`

Lets the first `amount` many events from the input stream pass to the
output stream, then makes the output stream complete.

Marble diagram:

```text
--a---b--c----d---e--
   take(3)
--a---b--c|
```

#### Arguments:

- `amount: number` How many events to allow from the input stream before completing the output stream.

#### Returns:  Stream 

- - -

### <a id="drop"></a> `drop(amount)`

Ignores the first `amount` many events from the input stream, and then
after that starts forwarding events from the input stream to the output
stream.

Marble diagram:

```text
--a---b--c----d---e--
      drop(3)
--------------d---e--
```

#### Arguments:

- `amount: number` How many events to ignore from the input stream before forwarding all events from the input stream to the output stream.

#### Returns:  Stream 

- - -

### <a id="last"></a> `last()`

When the input stream completes, the output stream will emit the last event
emitted by the input stream, and then will also complete.

Marble diagram:

```text
--a---b--c--d----|
      last()
-----------------d|
```

#### Returns:  Stream 

- - -

### <a id="startWith"></a> `startWith(initial)`

Prepends the given `initial` value to the sequence of events emitted by the
input stream. The returned stream is a MemoryStream, which means it is
already `remember()`'d.

Marble diagram:

```text
---1---2-----3---
  startWith(0)
0--1---2-----3---
```

#### Arguments:

- `initial` The value or event to prepend.

#### Returns:  MemoryStream 

- - -

### <a id="endWhen"></a> `endWhen(other)`

Uses another stream to determine when to complete the current stream.

When the given `other` stream emits an event or completes, the output
stream will complete. Before that happens, the output stream will behaves
like the input stream.

Marble diagram:

```text
---1---2-----3--4----5----6---
  endWhen( --------a--b--| )
---1---2-----3--4--|
```

#### Arguments:

- `other` Some other stream that is used to know when should the output stream of this operator complete.

#### Returns:  Stream 

- - -

### <a id="fold"></a> `fold(accumulate, seed)`

"Folds" the stream onto itself.

Combines events from the past throughout
the entire execution of the input stream, allowing you to accumulate them
together. It's essentially like `Array.prototype.reduce`. The returned
stream is a MemoryStream, which means it is already `remember()`'d.

The output stream starts by emitting the `seed` which you give as argument.
Then, when an event happens on the input stream, it is combined with that
seed value through the `accumulate` function, and the output value is
emitted on the output stream. `fold` remembers that output value as `acc`
("accumulator"), and then when a new input event `t` happens, `acc` will be
combined with that to produce the new `acc` and so forth.

Marble diagram:

```text
------1-----1--2----1----1------
  fold((acc, x) => acc + x, 3)
3-----4-----5--7----8----9------
```

#### Arguments:

- `accumulate: Function` A function of type `(acc: R, t: T) => R` that takes the previous accumulated value `acc` and the incoming event from the
input stream and produces the new accumulated value.
- `seed` The initial accumulated value, of type `R`.

#### Returns:  MemoryStream 

- - -

### <a id="replaceError"></a> `replaceError(replace)`

Replaces an error with another stream.

When (and if) an error happens on the input stream, instead of forwarding
that error to the output stream, *replaceError* will call the `replace`
function which returns the stream that the output stream will replicate.
And, in case that new stream also emits an error, `replace` will be called
again to get another stream to start replicating.

Marble diagram:

```text
--1---2-----3--4-----X
  replaceError( () => --10--| )
--1---2-----3--4--------10--|
```

#### Arguments:

- `replace: Function` A function of type `(err) => Stream` that takes the error that occurred on the input stream or on the previous replacement
stream and returns a new stream. The output stream will behave like the
stream that this function returns.

#### Returns:  Stream 

- - -

### <a id="flatten"></a> `flatten()`

Flattens a "stream of streams", handling only one nested stream at a time
(no concurrency).

If the input stream is a stream that emits streams, then this operator will
return an output stream which is a flat stream: emits regular events. The
flattening happens without concurrency. It works like this: when the input
stream emits a nested stream, *flatten* will start imitating that nested
one. However, as soon as the next nested stream is emitted on the input
stream, *flatten* will forget the previous nested one it was imitating, and
will start imitating the new nested one.

Marble diagram:

```text
--+--------+---------------
  \        \
   \       ----1----2---3--
   --a--b----c----d--------
          flatten
-----a--b------1----2---3--
```

#### Returns:  Stream 

- - -

### <a id="compose"></a> `compose(operator)`

Passes the input stream to a custom operator, to produce an output stream.

*compose* is a handy way of using an existing function in a chained style.
Instead of writing `outStream = f(inStream)` you can write
`outStream = inStream.compose(f)`.

#### Arguments:

- `operator: function` A function that takes a stream as input and returns a stream as well.

#### Returns:  Stream 

- - -

### <a id="remember"></a> `remember()`

Returns an output stream that behaves like the input stream, but also
remembers the most recent event that happens on the input stream, so that a
newly added listener will immediately receive that memorised event.

#### Returns:  MemoryStream 

- - -

### <a id="debug"></a> `debug(labelOrSpy)`

Returns an output stream that identically behaves like the input stream,
but also runs a `spy` function for each event, to help you debug your app.

*debug* takes a `spy` function as argument, and runs that for each event
happening on the input stream. If you don't provide the `spy` argument,
then *debug* will just `console.log` each event. This helps you to
understand the flow of events through some operator chain.

Please note that if the output stream has no listeners, then it will not
start, which means `spy` will never run because no actual event happens in
that case.

Marble diagram:

```text
--1----2-----3-----4--
        debug
--1----2-----3-----4--
```

#### Arguments:

- `labelOrSpy: function` A string to use as the label when printing debug information on the console, or a 'spy' function that takes an event
as argument, and does not need to return anything.

#### Returns:  Stream 

- - -

### <a id="imitate"></a> `imitate(target)`

*imitate* changes this current Stream to emit the same events that the
`other` given Stream does. This method returns nothing.

This method exists to allow one thing: **circular dependency of streams**.
For instance, let's imagine that for some reason you need to create a
circular dependency where stream `first$` depends on stream `second$`
which in turn depends on `first$`:

<!-- skip-example -->
```js
import delay from 'xstream/extra/delay'

var first$ = second$.map(x => x * 10).take(3);
var second$ = first$.map(x => x + 1).startWith(1).compose(delay(100));
```

However, that is invalid JavaScript, because `second$` is undefined
on the first line. This is how *imitate* can help solve it:

```js
import delay from 'xstream/extra/delay'

var secondProxy$ = xs.create();
var first$ = secondProxy$.map(x => x * 10).take(3);
var second$ = first$.map(x => x + 1).startWith(1).compose(delay(100));
secondProxy$.imitate(second$);
```

We create `secondProxy$` before the others, so it can be used in the
declaration of `first$`. Then, after both `first$` and `second$` are
defined, we hook `secondProxy$` with `second$` with `imitate()` to tell
that they are "the same". `imitate` will not trigger the start of any
stream, it just binds `secondProxy$` and `second$` together.

The following is an example where `imitate()` is important in Cycle.js
applications. A parent component contains some child components. A child
has an action stream which is given to the parent to define its state:

<!-- skip-example -->
```js
const childActionProxy$ = xs.create();
const parent = Parent({...sources, childAction$: childActionProxy$});
const childAction$ = parent.state$.map(s => s.child.action$).flatten();
childActionProxy$.imitate(childAction$);
```

Note, though, that **`imitate()` does not support MemoryStreams**. If we
would attempt to imitate a MemoryStream in a circular dependency, we would
either get a race condition (where the symptom would be "nothing happens")
or an infinite cyclic emission of values. It's useful to think about
MemoryStreams as cells in a spreadsheet. It doesn't make any sense to
define a spreadsheet cell `A1` with a formula that depends on `B1` and
cell `B1` defined with a formula that depends on `A1`.

If you find yourself wanting to use `imitate()` with a
MemoryStream, you should rework your code around `imitate()` to use a
Stream instead. Look for the stream in the circular dependency that
represents an event stream, and that would be a candidate for creating a
proxy Stream which then imitates the target Stream.

#### Arguments:

- `target: Stream` The other stream to imitate on the current one. Must not be a MemoryStream.

- - -

### <a id="shamefullySendNext"></a> `shamefullySendNext(value)`

Forces the Stream to emit the given value to its listeners.

As the name indicates, if you use this, you are most likely doing something
The Wrong Way. Please try to understand the reactive way before using this
method. Use it only when you know what you are doing.

#### Arguments:

- `value` The "next" value you want to broadcast to all listeners of this Stream.

- - -

### <a id="shamefullySendError"></a> `shamefullySendError(error)`

Forces the Stream to emit the given error to its listeners.

As the name indicates, if you use this, you are most likely doing something
The Wrong Way. Please try to understand the reactive way before using this
method. Use it only when you know what you are doing.

#### Arguments:

- `error: any` The error you want to broadcast to all the listeners of this Stream.

- - -

### <a id="shamefullySendComplete"></a> `shamefullySendComplete()`

Forces the Stream to emit the "completed" event to its listeners.

As the name indicates, if you use this, you are most likely doing something
The Wrong Way. Please try to understand the reactive way before using this
method. Use it only when you know what you are doing.

- - -

### <a id="setDebugListener"></a> `setDebugListener(listener)`

Adds a "debug" listener to the stream. There can only be one debug
listener, that's why this is 'setDebugListener'. To remove the debug
listener, just call setDebugListener(null).

A debug listener is like any other listener. The only difference is that a
debug listener is "stealthy": its presence/absence does not trigger the
start/stop of the stream (or the producer inside the stream). This is
useful so you can inspect what is going on without changing the behavior
of the program. If you have an idle stream and you add a normal listener to
it, the stream will start executing. But if you set a debug listener on an
idle stream, it won't start executing (not until the first normal listener
is added).

As the name indicates, we don't recommend using this method to build app
logic. In fact, in most cases the debug operator works just fine. Only use
this one if you know what you're doing.

#### Arguments:

- `listener: Listener\<T>`

- - -

# FAQ

**Q: Why does `imitate()` support a Stream but not a MemoryStream?**

A: MemoryStreams are meant for representing "values over time" (your age), while Streams represent simply events (your birthdays). MemoryStreams are usually initialized with a value, and `imitate()` is meant for creating circular dependencies of streams. If we would attempt to imitate a MemoryStream in a circular dependency, we would either get a race condition (where the symptom would be "nothing happens") or an infinite cyclic emission of values.

If you find yourself wanting to use `imitate()` with a MemoryStream, you should rework your code around `imitate()` to use a Stream instead. Look for the stream in the circular dependency that represents an event stream, and that would be a candidate for creating a MimicStream which then imitates the real event stream.

**Q: What's the difference between xstream and RxJS?**

A: Read this [blog post](http://staltz.com/why-we-built-xstream.html) on the topic. In short:

- xstream Streams are multicast always.
- RxJS Observables are unicast by default, and opt-in multicast.
- xstream has few operators *as a feature* (helps against decision paralysis).
- RxJS has many operators *as a feature* (helps for flexibility and power).

**Q: What is the equivalent of [`withLatestFrom`](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-withLatestFrom) in xstream?**

A: `withLatestFrom` is implemented as an extra named [`sampleCombine`](https://github.com/staltz/xstream/blob/master/EXTRA_DOCS.md#sampleCombine).

-----

# Misc.

## Acknowledgements

*xstream* is built by [staltz](https://github.com/staltz) and [TylorS](https://github.com/tylors).

## CHANGELOG

Read the [CHANGELOG](https://github.com/staltz/xstream/blob/master/CHANGELOG.md) for release notes of all versions of *xstream*.

## License

[MIT](https://github.com/staltz/xstream/blob/master/LICENSE)
