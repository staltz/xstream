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
import periodic from 'xstream/extra/periodic';

// Tick every second incremental numbers,
// only pass even numbers, then map them to their square,
// and stop after 5 seconds has passed

var stream = periodic(1000)
  .filter(i => i % 2 === 0)
  .map(i => i * i)
  .endWhen(periodic(5000).take(1))

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
