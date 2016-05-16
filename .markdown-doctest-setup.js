var xstream = require('./index').default;

function noop () {}

module.exports = {
  require: {
    xstream: xstream
  },

  globals: {
    xs: xstream,
    stream: xstream.empty(),
    A: xstream.never(),
    B: xstream.never(),
    setInterval: noop,
    console: {
      log: noop,
      error: noop
    },
    listener: {
      next: noop,
      error: noop,
      complete: noop
    }
  }
}
