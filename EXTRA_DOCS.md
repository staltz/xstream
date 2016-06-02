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

