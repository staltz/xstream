# Overview

XStream has four fundamental types: Stream, Listener, Producer, and MemoryStream.

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
