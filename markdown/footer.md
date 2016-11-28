# Extra operators and factories

The operators and factories listed above are the core functions. `xstream` has plenty of extra operators, [documented here](https://github.com/staltz/xstream/blob/master/EXTRA_DOCS.md).

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
