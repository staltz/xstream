<h2 class="site-subtitle">An extremely intuitive, small, and fast<br />functional reactive stream library for JavaScript</h2>

- Only 26 core operators and factories
- Written in TypeScript
- Approximately 30 kB in size, without minification or gzip
- On average, faster than RxJS 4, Kefir, Bacon.js, as fast as RxJS 5, and slower than most.js
- Tailored for [Cycle.js](http://cycle.js.org), or applications with limited use of `subscribe`

![](https://badge-size.herokuapp.com/staltz/xstream/master/dist/xstream.js.svg)
![](https://badge-size.herokuapp.com/staltz/xstream/master/dist/xstream.min.js.svg?compression=gzip)
[![Build Status](https://travis-ci.org/staltz/xstream.svg?branch=master)](https://travis-ci.org/staltz/xstream)

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
- [`of`](#of)
- [`fromArray`](#fromArray)
- [`fromPromise`](#fromPromise)
- [`periodic`](#periodic)
- [`merge`](#merge)
- [`combine`](#combine)

## Methods and Operators

- [`combine`](#combine)
- [`addListener`](#addListener)
- [`removeListener`](#removeListener)
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
- [`flattenConcurrently`](#flattenConcurrently)
- [`merge`](#merge)
- [`compose`](#compose)
- [`remember`](#remember)
- [`imitate`](#imitate)
- [`debug`](#debug)
- [`shamefullySendNext`](#shamefullySendNext)
- [`shamefullySendError`](#shamefullySendError)
- [`shamefullySendComplete`](#shamefullySendComplete)

# Overview

XStream has four fundamental types: Stream, Listener, Producer, and MemoryStream.

## Stream

A Stream is an **event emitter** with multiple Listeners. When an event happens on the
Stream, it is broadcast to all its Listeners at the same time.

Streams have methods attached to them called *operators*, such as `map`, `filter`, `fold`, `take`, etc. When called, an operator creates and returns another Stream. The returned Stream is actually a Listener of the source Stream (I forgot to tell you that Streams may be Listeners, too). So once the source Stream broadcasts an event, the event will pass through the operator logic and the returned Stream may perhaps broadcast its own event based on the source one.

You can also trigger an event to happen on a Stream with the `shamefullySend*` methods. But you don't want to do that. Really, avoid doing that because it's not the reactive way and you'll be missing the point of this library. Ok?

## Listener

A Listener is an object with three functions attached to it: `next`, `error`, and `complete`. There is one function for each type of event a Stream may emit.

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

Because Streams are Listeners, if you give a Stream as the Listener in `start(stream)`, essentially the Producer is now generating events that will be broadcast on the Stream. Nice, huh? Now a bunch of listeners can be attached to the Stream and they can all get those events originally coming from the Producer. That's why `xs.create(producer)` receives a Producer to be the heart of a new Stream. Check this out:

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

- `promise: Promise` The promise to be converted as a stream.

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
imitates each of the argument streams, in parallel.

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

### <a id="combine"></a> `combine(project, stream1, stream2)`

Combines multiple streams together to return a stream whose events are
calculated from the latest events of each of the input streams.

*combine* remembers the most recent event from each of the input streams.
When any of the input streams emits an event, that event together with all
the other saved events are combined in the `project` function which should
return a value. That value will be emitted on the output stream. It's
essentially a way of mixing the events from multiple streams according to a
formula.

Marble diagram:

```text
--1----2-----3--------4---
----a-----b-----c--d------
  combine((x,y) => x+y)
----1a-2a-2b-3b-3c-3d-4d--
```

#### Arguments:

- `project: Function` A function of type `(x: T1, y: T2) => R` or similar that takes the most recent events `x` and `y` from the input
streams and returns a value. The output stream will emit that value. The
number of arguments for this function should match the number of input
streams.
- `stream1: Stream` A stream to combine together with other streams.
- `stream2: Stream` A stream to combine together with other streams. Two or more streams may be given as arguments.

#### Returns:  Stream 

- - -


# Methods and Operators

Methods are functions attached to a Stream instance, like `stream.addListener()`. Operators are also methods, but return a new Stream, leaving the existing Stream unmodified, except for the fact that it has a child Stream attached as Listener.

### <a id="combine"></a> `combine(project, other)`

Combines multiple streams with the input stream to return a stream whose
events are calculated from the latest events of each of its input streams.

*combine* remembers the most recent event from each of the input streams.
When any of the input streams emits an event, that event together with all
the other saved events are combined in the `project` function which should
return a value. That value will be emitted on the output stream. It's
essentially a way of mixing the events from multiple streams according to a
formula.

Marble diagram:

```text
--1----2-----3--------4---
----a-----b-----c--d------
  combine((x,y) => x+y)
----1a-2a-2b-3b-3c-3d-4d--
```

#### Arguments:

- `project: Function` A function of type `(x: T1, y: T2) => R` or similar that takes the most recent events `x` and `y` from the input
streams and returns a value. The output stream will emit that value. The
number of arguments for this function should match the number of input
streams.
- `other: Stream` Another stream to combine together with the input stream. There may be more of these arguments.

#### Returns:  Stream 

- - -

### <a id="addListener"></a> `addListener(listener)`

Adds a Listener to the Stream.

#### Arguments:

- `listener: Listener\<T>`

- - -

### <a id="removeListener"></a> `removeListener(listener)`

Removes a Listener from the Stream, assuming the Listener was added to it.

#### Arguments:

- `listener: Listener\<T>`

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

- `passes: Function` A function of type `(t: T) +> boolean` that takes an event from the input stream and checks if it passes, by returning a
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
input stream.

Marble diagram:

```text
---1---2-----3---
  startWith(0)
0--1---2-----3---
```

#### Arguments:

- `initial` The value or event to prepend.

#### Returns:  Stream 

- - -

### <a id="endWhen"></a> `endWhen(other)`

Uses another stream to determine when to complete the current stream.

When the given `other` stream emits an event or completes, the output
stream will complete. Before that happens, the output stream will imitate
whatever happens on the input stream.

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
together. It's essentially like `Array.prototype.reduce`.

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

#### Returns:  Stream 

- - -

### <a id="replaceError"></a> `replaceError(replace)`

Replaces an error with another stream.

When (and if) an error happens on the input stream, instead of forwarding
that error to the output stream, *replaceError* will call the `replace`
function which returns the stream that the output stream will imitate. And,
in case that new stream also emits an error, `replace` will be called again
to get another stream to start imitating.

Marble diagram:

```text
--1---2-----3--4-----X
  replaceError( () => --10--| )
--1---2-----3--4--------10--|
```

#### Arguments:

- `replace: Function` A function of type `(err) => Stream` that takes the error that occurred on the input stream or on the previous replacement
stream and returns a new stream. The output stream will imitate the stream
that this function returns.

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

### <a id="merge"></a> `merge(other)`

Blends two streams together, emitting events from both.

*merge* takes an `other` stream and returns an output stream that imitates
both the input stream and the `other` stream.

Marble diagram:

```text
--1----2-----3--------4---
----a-----b----c---d------
           merge
--1-a--2--b--3-c---d--4---
```

#### Arguments:

- `other: Stream` Another stream to merge together with the input stream.

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

Returns an output stream that imitates the input stream, but also remembers
the most recent event that happens on the input stream, so that a newly
added listener will immediately receive that memorised event.

#### Returns:  MemoryStream 

- - -

### <a id="imitate"></a> `imitate(other)`

Changes this current stream to imitate the `other` given stream.

The *imitate* method returns nothing. Instead, it changes the behavior of
the current stream, making it re-emit whatever events are emitted by the
given `other` stream.

#### Arguments:

- `other: Stream` The stream to imitate on the current one.

- - -

### <a id="debug"></a> `debug(spy)`

Returns an output stream that identically imitates the input stream, but
also runs a `spy` function fo each event, to help you debug your app.

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

- `spy: function` A function that takes an event as argument, and returns nothing.

#### Returns:  Stream 

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

# FAQ

**Q: What's the difference between xstream and RxJS?**

A: Read this [blog post](http://staltz.com/why-we-built-xstream.html) on the topic.

**Q: What is the equivalent of [`withLatestFrom`](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-withLatestFrom) in xstream?**

<!-- skip-example -->
```js
A.withLatestFrom(B, (a, b) => a + b)
```

can be achieved in *xstream* with

```js
B.map(b => A.map(a => a + b)).flatten()
```

And can be interpreted/read as "when a `B` event happens, remember it and map it to all the subsequent events of `A` mapped to `a + b`".

-----

**Acknowledgements:** *xstream* is built by [staltz](https://github.com/staltz) and [TylorS](https://github.com/tylors).

**License:** MIT

# CHANGELOG
<a name="2.5.0"></a>
# [2.5.0](https://github.com/staltz/xstream/compare/v2.4.3...v2.5.0) (2016-05-21)


### Features

* **extra:** add new extra factory fromDiagram ([d6c4ae5](https://github.com/staltz/xstream/commit/d6c4ae5))



<a name="2.4.3"></a>
## [2.4.3](https://github.com/staltz/xstream/compare/v2.4.2...v2.4.3) (2016-05-16)


### Bug Fixes

* **extra:** add safety check against nulls for next() etc ([cf82a8b](https://github.com/staltz/xstream/commit/cf82a8b))

### Performance Improvements

* **debounce:** improve debounce speed/rate ([8bf7903](https://github.com/staltz/xstream/commit/8bf7903))



<a name="2.4.2"></a>
## [2.4.2](https://github.com/staltz/xstream/compare/v2.4.1...v2.4.2) (2016-05-13)


### Bug Fixes

* **flatten:** fix map+flatten fusion to respect filter+map fusion ([6520550](https://github.com/staltz/xstream/commit/6520550))



<a name="2.4.1"></a>
## [2.4.1](https://github.com/staltz/xstream/compare/v2.4.0...v2.4.1) (2016-05-13)


### Bug Fixes

* **operators:** add safety check against nulls for next() etc ([5d433c3](https://github.com/staltz/xstream/commit/5d433c3))
* **operators:** improve *type* metadata for operators with fusion ([fb1e81c](https://github.com/staltz/xstream/commit/fb1e81c))



<a name="2.4.0"></a>
# [2.4.0](https://github.com/staltz/xstream/compare/v2.3.0...v2.4.0) (2016-05-12)


### Bug Fixes

* **flatten:** add ins field as metadata to flatten ([cbc1f8b](https://github.com/staltz/xstream/commit/cbc1f8b))

### Features

* **extra:** implement new extra operator: dropUntil ([e06d502](https://github.com/staltz/xstream/commit/e06d502))
* **extra:** implement new extra operator: split ([84742e8](https://github.com/staltz/xstream/commit/84742e8))



<a name="2.3.0"></a>
# [2.3.0](https://github.com/staltz/xstream/compare/v2.2.1...v2.3.0) (2016-05-09)


### Bug Fixes

* **combine:** fix combine() to export its Producer class ([700a129](https://github.com/staltz/xstream/commit/700a129))

### Features

* **operators:** add type metadata string to all operators/producers ([a734fd4](https://github.com/staltz/xstream/commit/a734fd4))



<a name="2.2.1"></a>
## [2.2.1](https://github.com/staltz/xstream/compare/v2.2.0...v2.2.1) (2016-05-03)


### Performance Improvements

* **combine:** apply some perf optimizations to combine ([ee4ec4c](https://github.com/staltz/xstream/commit/ee4ec4c))



<a name="2.2.0"></a>
# [2.2.0](https://github.com/staltz/xstream/compare/v2.1.4...v2.2.0) (2016-05-02)


### Features

* **combine:** support zero streams args to combine() ([1b3ca90](https://github.com/staltz/xstream/commit/1b3ca90))



<a name="2.1.4"></a>
## [2.1.4](https://github.com/staltz/xstream/compare/v2.1.3...v2.1.4) (2016-05-02)


### Bug Fixes

* **combine:** guard CombineListener against invalid out stream ([74c6061](https://github.com/staltz/xstream/commit/74c6061))

### Performance Improvements

* **flatten:** avoid cut() method in flattening ([28afee9](https://github.com/staltz/xstream/commit/28afee9))



<a name="2.1.3"></a>
## [2.1.3](https://github.com/staltz/xstream/compare/v2.1.2...v2.1.3) (2016-04-30)


### Bug Fixes

* **remember:** return MemoryStream, not Stream ([4f50922](https://github.com/staltz/xstream/commit/4f50922))



<a name="2.1.2"></a>
## [2.1.2](https://github.com/staltz/xstream/compare/v2.1.1...v2.1.2) (2016-04-30)


### Bug Fixes

* **combine:** fix CombineFactorySignature ([c65bd0b](https://github.com/staltz/xstream/commit/c65bd0b))



<a name="2.1.1"></a>
## [2.1.1](https://github.com/staltz/xstream/compare/v2.1.0...v2.1.1) (2016-04-30)


### Bug Fixes

* **remember:** build safety against map+map fusion ([079602c](https://github.com/staltz/xstream/commit/079602c))



<a name="2.1.0"></a>
# [2.1.0](https://github.com/staltz/xstream/compare/v2.0.2...v2.1.0) (2016-04-30)


### Bug Fixes

* **flatten:** fix TypeScript output type ([26f2241](https://github.com/staltz/xstream/commit/26f2241)), closes [#4](https://github.com/staltz/xstream/issues/4)
* **flattenConcurrently:** fix TypeScript output type ([b5445a5](https://github.com/staltz/xstream/commit/b5445a5)), closes [#4](https://github.com/staltz/xstream/issues/4)

### Features

* **create:** Throw an error if for incomplete producer ([39c7c80](https://github.com/staltz/xstream/commit/39c7c80))



<a name="2.0.2"></a>
## [2.0.2](https://github.com/staltz/xstream/compare/v2.0.1...v2.0.2) (2016-04-28)


### Bug Fixes

* **filter:** fix filter fusion logic. ([8c417f9](https://github.com/staltz/xstream/commit/8c417f9))

### Performance Improvements

* **Stream:** improve way of fixing ils array concurrency ([accd2d0](https://github.com/staltz/xstream/commit/accd2d0))



<a name="2.0.1"></a>
## [2.0.1](https://github.com/staltz/xstream/compare/v2.0.0...v2.0.1) (2016-04-28)


### Bug Fixes

* **take:** fix take() behavior when stopping ([438fc0f](https://github.com/staltz/xstream/commit/438fc0f))



<a name="2.0.0"></a>
# [2.0.0](https://github.com/staltz/xstream/compare/v1.1.1...v2.0.0) (2016-04-27)


### Bug Fixes

* **package:** put extra operators in xstream/extra ([2735a74](https://github.com/staltz/xstream/commit/2735a74))


### BREAKING CHANGES

* package: Import extra operators from xstream/extra/the-operator-you-want not from
xstream/lib/extra/the-operator-you-want



<a name="1.1.1"></a>
## [1.1.1](https://github.com/staltz/xstream/compare/v1.1.0...v1.1.1) (2016-04-27)


### Features

* **addListener:** throw an error if next, error or complete functions are missing ([b6e9df3](https://github.com/staltz/xstream/commit/b6e9df3))



<a name="1.1.0"></a>
# [1.1.0](https://github.com/staltz/xstream/compare/v1.0.1...v1.1.0) (2016-04-26)


### Bug Fixes

* **core:** export all operator classes ([10ef8f3](https://github.com/staltz/xstream/commit/10ef8f3))
* **package:** fix TS dependency on es6-promise, and bump ([4c8adb8](https://github.com/staltz/xstream/commit/4c8adb8))
* **package.json:** add typings field, bump to 1.0.4 ([bffd84b](https://github.com/staltz/xstream/commit/bffd84b))
* **typings:** fix usage of ambient es6-promise ([6b4ae8e](https://github.com/staltz/xstream/commit/6b4ae8e))
* **typings:** make es6-promise an ambient dep, and bump ([49edd74](https://github.com/staltz/xstream/commit/49edd74))

### Features

* **extra:** implement new flattenSequentially() extra operator ([4a6e63e](https://github.com/staltz/xstream/commit/4a6e63e))



<a name="1.0.1"></a>
## [1.0.1](https://github.com/staltz/xstream/compare/a3a08e7...v1.0.1) (2016-04-22)


### Bug Fixes

* **compose2:** fix type signature errors ([5c77ff9](https://github.com/staltz/xstream/commit/5c77ff9))
* **core:** fix map type signature ([133c400](https://github.com/staltz/xstream/commit/133c400))
* **dropRepeats:** move dropRepeats from core to extra ([78851c8](https://github.com/staltz/xstream/commit/78851c8))
* **filterMap:** properly catch errors that could be thrown ([8ff48a5](https://github.com/staltz/xstream/commit/8ff48a5))
* **flattenConcurrently:** fix inner management when optimization is off ([da1f379](https://github.com/staltz/xstream/commit/da1f379))
* **fromArray:** rename from() producer to fromArray() ([05f519a](https://github.com/staltz/xstream/commit/05f519a))
* **fromEvent:** rename static domEvent() to fromEvent() as extra ([c481cc8](https://github.com/staltz/xstream/commit/c481cc8))
* **MemoryStream:** fix how MemoryStream handles late sync emissions ([00de09d](https://github.com/staltz/xstream/commit/00de09d))
* **operator:** add more tear down logic in _stop() in operators ([2483107](https://github.com/staltz/xstream/commit/2483107))
* **operator:** fix all operators redirection of error/complete ([2caa2ca](https://github.com/staltz/xstream/commit/2caa2ca))
* **package.json:** no postinstall npm script anymore ([4011aa1](https://github.com/staltz/xstream/commit/4011aa1))
* **periodic:** rename interval() factory to periodic() ([6a2adc5](https://github.com/staltz/xstream/commit/6a2adc5))
* **src:** make index be an import facade for core.ts ([180f7c4](https://github.com/staltz/xstream/commit/180f7c4))
* **Stream:** fix unsubscription semantics w.r.t. restarting ([9a0f3af](https://github.com/staltz/xstream/commit/9a0f3af))
* **Stream:** stop the producer syncly after stream completes ([faba7bf](https://github.com/staltz/xstream/commit/faba7bf))
* **Stream:** stop the producer syncly after the Stream errors ([6c803ac](https://github.com/staltz/xstream/commit/6c803ac))
* **Stream:** use underscore for pseudo-private fields in Stream ([95f2ebb](https://github.com/staltz/xstream/commit/95f2ebb))
* **take:** fix take() operator, and also combine and merge ([c5fdfc0](https://github.com/staltz/xstream/commit/c5fdfc0))

### Features

* **concat:** implement extra concat() operator ([7652011](https://github.com/staltz/xstream/commit/7652011))
* **core:** flatten and flattenConcurrently should optimize for FilterMapOperator ([e1bebff](https://github.com/staltz/xstream/commit/e1bebff))
* **core:** implement filter + map fusion ([b0507e6](https://github.com/staltz/xstream/commit/b0507e6))
* **core:** use filterMap fusion for map() + filter ([a723fa4](https://github.com/staltz/xstream/commit/a723fa4))
* **createWithMemory:** rename xs.MemoryStream to xs.createWithMemory ([c88d6c2](https://github.com/staltz/xstream/commit/c88d6c2))
* **debounce:** implement debounce operator ([7dfb709](https://github.com/staltz/xstream/commit/7dfb709))
* **debounce:** make debounce an extra operator ([34fd6c1](https://github.com/staltz/xstream/commit/34fd6c1))
* **delay:** implement extra operator delay() and compose() ([48c5abc](https://github.com/staltz/xstream/commit/48c5abc))
* **domEvent:** implement domEvent stream constructor ([ad40a08](https://github.com/staltz/xstream/commit/ad40a08))
* **drop:** rename skip() to drop() ([cab26a9](https://github.com/staltz/xstream/commit/cab26a9))
* **dropRepeats:** implement core instance operator dropRepeats() ([b7dccf9](https://github.com/staltz/xstream/commit/b7dccf9))
* **emptyObserver:** makes emptyObserver noop functions instead of null ([e1d2537](https://github.com/staltz/xstream/commit/e1d2537))
* **endWhen:** implement operator endWhen(), add tests ([23099ef](https://github.com/staltz/xstream/commit/23099ef))
* **factory:** add factory from() with FromMachine ([e76acef](https://github.com/staltz/xstream/commit/e76acef))
* **factory:** implement merge() with MergeProducer ([42b6f12](https://github.com/staltz/xstream/commit/42b6f12))
* **filterMap:** implement all combinations of filter and map fusion ([5eb5822](https://github.com/staltz/xstream/commit/5eb5822))
* **flatten:** implement flatten operator, a.k.a. switch() ([6255e53](https://github.com/staltz/xstream/commit/6255e53))
* **flattenConcurrently:** rename flatten to flattenConcurrently ([b3a87ee](https://github.com/staltz/xstream/commit/b3a87ee))
* **fromPromise:** implement factory fromPromise() ([ad0ccfd](https://github.com/staltz/xstream/commit/ad0ccfd))
* **imitate:** implement imitate() operator for circular dependencies ([6545670](https://github.com/staltz/xstream/commit/6545670))
* **index:** export new domEvent constructor ([870fdc6](https://github.com/staltz/xstream/commit/870fdc6))
* **mapTo:** implement mapTo ([f73bc8e](https://github.com/staltz/xstream/commit/f73bc8e))
* **MapTo:** adjust to more private variables ([a5ed5ab](https://github.com/staltz/xstream/commit/a5ed5ab))
* **Observer:** rename complete() callback to end() ([d282684](https://github.com/staltz/xstream/commit/d282684))
* **operator:** implement combine(), both static and instance ([f65a6a3](https://github.com/staltz/xstream/commit/f65a6a3))
* **operator:** implement debug() operator with DebugMachine ([e2a0342](https://github.com/staltz/xstream/commit/e2a0342))
* **operator:** implement filter operator with FilterMachine ([a74f160](https://github.com/staltz/xstream/commit/a74f160))
* **operator:** implement flatten() operator ([4800873](https://github.com/staltz/xstream/commit/4800873))
* **operator:** implement fold operator with FoldMachine ([57453f2](https://github.com/staltz/xstream/commit/57453f2))
* **operator:** implement last() operator with LastMachine ([747e255](https://github.com/staltz/xstream/commit/747e255))
* **operator:** implement map operator with MapMachine ([76df500](https://github.com/staltz/xstream/commit/76df500))
* **operator:** implement skip operator with SkipMachine ([32dd8ac](https://github.com/staltz/xstream/commit/32dd8ac))
* **operator:** implement take operator with TakeMachine ([6e1d0db](https://github.com/staltz/xstream/commit/6e1d0db))
* **pairwise:** implement extra operator pairwise() ([5b1ec51](https://github.com/staltz/xstream/commit/5b1ec51))
* **remember:** implement RememeberProducer ([7279ad8](https://github.com/staltz/xstream/commit/7279ad8))
* **RememberOperator:** adjust to work with MemoryStream ([0898404](https://github.com/staltz/xstream/commit/0898404))
* **replaceError:** implement replaceError(), wrap code with try-catch ([ffa5976](https://github.com/staltz/xstream/commit/ffa5976))
* **shamefullySendNext:** introduce shamefullySendNext and hide _next callback ([552caff](https://github.com/staltz/xstream/commit/552caff))
* **startWith:** implement startWith operator ([3489ce3](https://github.com/staltz/xstream/commit/3489ce3))
* **Stream:** add a concept of current value ([cc5650f](https://github.com/staltz/xstream/commit/cc5650f))
* **Stream:** add debounce to Stream prototype ([f44b819](https://github.com/staltz/xstream/commit/f44b819))
* **Stream:** add mapTo to Stream prototype ([58c83f9](https://github.com/staltz/xstream/commit/58c83f9))
* **Stream:** add never() and empty() stream factories ([04f59b0](https://github.com/staltz/xstream/commit/04f59b0))
* **Stream:** implement really simply Stream and interval() factory ([a3a08e7](https://github.com/staltz/xstream/commit/a3a08e7))
* **Stream:** implement Stream ([86d68ff](https://github.com/staltz/xstream/commit/86d68ff))
* **Stream:** implement xs.of() ([f86fd49](https://github.com/staltz/xstream/commit/f86fd49))
* **takeUntil:** implement and test takeUntil() ([304bed1](https://github.com/staltz/xstream/commit/304bed1))
* **throw:** implement new static factory throw() ([76879a5](https://github.com/staltz/xstream/commit/76879a5))

### Performance Improvements

* **core:** have FilterMapOperator extend MapOperator ([e0c153a](https://github.com/staltz/xstream/commit/e0c153a))
* **debug:** improve performance of debug() operator, using Proxy class ([9f766af](https://github.com/staltz/xstream/commit/9f766af))
* **filter-map-reduce:** add preliminary perf micro benchmarks ([8b1f2d3](https://github.com/staltz/xstream/commit/8b1f2d3))
* **filter-map-reduce:** improve filter-map-reduce test to actually do reduce() too ([7ff9fd0](https://github.com/staltz/xstream/commit/7ff9fd0))
* **fold:** improve performance by using shorter names ([8a25fe7](https://github.com/staltz/xstream/commit/8a25fe7))
* **from:** improve from factory perf by renaming a var ([a814c8a](https://github.com/staltz/xstream/commit/a814c8a))
* **fromArray:** rename/fix from() to fromArray() in perf benchmarks ([a433dd5](https://github.com/staltz/xstream/commit/a433dd5))
* **merge:** add merge performance benchmark ([de9f002](https://github.com/staltz/xstream/commit/de9f002))
* **operator:** fix all operators to refer this.proxy initially to emptyObserver ([ad210fc](https://github.com/staltz/xstream/commit/ad210fc))
* **operator:** replace operator proxies with class, improves perf ([2e6ec27](https://github.com/staltz/xstream/commit/2e6ec27))
* **perf:** fix xstream perf benchmark for merge() ([4758a1d](https://github.com/staltz/xstream/commit/4758a1d))
* **scan:** add performance benchmark for fold ([5d5ef94](https://github.com/staltz/xstream/commit/5d5ef94))
* **skip:** improve skip perf by using Proxy Observer class ([5233f43](https://github.com/staltz/xstream/commit/5233f43))
* **Stream:** improve performance of Observer methods in Stream ([465f22d](https://github.com/staltz/xstream/commit/465f22d))
* **Stream:** remove this.num in Stream to improve perf ([53bcaad](https://github.com/staltz/xstream/commit/53bcaad))
* **Stream:** squeeze kB size in map and filter fusion ([23ac9d0](https://github.com/staltz/xstream/commit/23ac9d0))
* **Stream:** tiny saving of lookups and source code size ([6527129](https://github.com/staltz/xstream/commit/6527129))
* **take:** improve take() perf by using Proxy Observer class ([6eae1a9](https://github.com/staltz/xstream/commit/6eae1a9))

### Reverts

* **takeUntil:** revert takeUntil implementation ([6f62fc1](https://github.com/staltz/xstream/commit/6f62fc1))



