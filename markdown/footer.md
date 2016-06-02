# Extra operators and factories

The operators and factories listed above are the core functions. `xstream` has plenty of extra operators, [documented here](./EXTRA_DOCS.md).

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
