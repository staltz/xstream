var xstream = require('./index').default;
var eventsModule = require('events');

function noop () {}

class FakeEventTarget {
  constructor() {}

  emit(x) {
    if (typeof this.handler !== 'function') {
      return;
    }
    this.handler.call(void 0, x);
  }

  addEventListener(e, handler, capture) {
    this.event = e;
    this.handler = handler;
    this.capture = capture;
  }

  removeEventListener(e, handler, capture) {
    this.removedEvent = e;
    this.removedCapture = capture;
    this.handler = this.event = this.capture = void 0;
  }

  dispatchEvent(event) {
    return true;
  }

  querySelector() {
    return this;
  }
}

module.exports = {
  require: {
    xstream: xstream,
    events: eventsModule,
  },

  regexRequire: {
    'xstream/extra/(.*)': function (_, extra) {
      return require('./extra/' + extra).default;
    }
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
    document: new FakeEventTarget(),
    listener: {
      next: noop,
      error: noop,
      complete: noop
    }
  }
}
