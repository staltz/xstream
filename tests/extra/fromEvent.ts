/// <reference types="mocha"/>
/// <reference types="node" />
import {EventEmitter} from 'events';
import fromEvent from '../../src/extra/fromEvent';
import * as assert from 'assert';
function noop() {}

class FakeEventTarget implements EventTarget {
  public handler: EventListener | undefined;
  public event: string | undefined;
  public capture: boolean | undefined;
  public removedEvent: string | undefined;
  public removedCapture: boolean | undefined;

  constructor() {}

  emit(x: any) {
    if (typeof this.handler !== 'function') {
        return;
    }
    this.handler.call(void 0, x);
  }

  addEventListener(e: string, handler: EventListener, capture: boolean) {
    this.event = e;
    this.handler = handler;
    this.capture = capture;
  }

  removeEventListener(e: string, handler: EventListener, capture: boolean) {
    this.removedEvent = e;
    this.removedCapture = capture;

    this.handler = void 0;
  }

  dispatchEvent(event: Event) {
    return true;
  }
}

class FakeEventEmitter extends EventEmitter {
  public handler: Function | undefined;
  public event: string | symbol | undefined;
  public removedEvent: string | symbol | undefined;

  constructor() {
    super();
  }

  emit( eventName: string, ...args: any[] ): any {
    if (typeof this.handler !== 'function') {
        return;
    }
    this.handler.apply(void 0, args );
    return true;
  }

  addListener(e: string, handler: Function): this {
    this.event = e;
    this.handler = handler;
    return this;
  }

  removeListener(e: string, handler: Function): this {
    this.removedEvent = e;
    this.handler = void 0;
    return this;
  }
}

describe('fromEvent (extra) - DOMEvent', () => {
  it('should call addEventListener with expected parameters', () => {
    const target = new FakeEventTarget();
    const stream = fromEvent(target, 'test', true);

    stream.addListener({next: noop, error: noop, complete: noop});

    assert.strictEqual(target.event, 'test');
    assert.strictEqual(target.capture, true);
  });

  it('should call addEventListener with expected parameters', () => {
    const target = new FakeEventTarget();
    const stream = fromEvent(target, 'test');

    stream.addListener({next: noop, error: noop, complete: noop});

    assert.strictEqual(target.event, 'test');
    assert.strictEqual(target.capture, false);
  });

  it('should propagate events', (done: any) => {
    const target = new FakeEventTarget();
    const stream = fromEvent(target, 'test').take(3);

    let expected = [1, 2, 3];

    stream.addListener({
      next: (x: any) => {
        assert.strictEqual(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.strictEqual(expected.length, 0);
        done();
      }
    });

    target.emit(1);
    target.emit(2);
    target.emit(3);
    target.emit(4);
  });

  it('should call removeEventListener with expected parameters', (done: any) => {
    const target = new FakeEventTarget();
    const stream = fromEvent(target, 'test', true);

    stream.take(1).addListener({
      next: (x) => {},
      error: (err: any) => done(err),
      complete() {
        setTimeout(() => {
          assert.strictEqual(target.removedEvent, 'test');
          assert.strictEqual(target.removedCapture, true);
          done();
        }, 5);
      }
    });

    target.emit(1);
    target.emit(2);
  });
});

describe('fromEvent (extra) - EventEmitter', () => {
  it('should call addListener with expected parameters', () => {
    const target = new FakeEventEmitter();
    const stream = fromEvent(target, 'test');

    stream.addListener({next: noop, error: noop, complete: noop});

    assert.strictEqual(target.event, 'test');
  });

  it('should propagate events', (done: any) => {
    const target = new FakeEventEmitter();
    const stream = fromEvent(target, 'test').take(3);

    let expected = [1, 2, 3];

    stream.addListener({
      next: (x: any) => {
        assert.strictEqual(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.strictEqual(expected.length, 0);
        done();
      }
    });

    target.emit( 'test', 1 );
    target.emit( 'test', 2 );
    target.emit( 'test', 3 );
    target.emit( 'test', 4 );
  });

  it('should call removeListener with expected parameters', (done: any) => {
    const target = new FakeEventEmitter();
    const stream = fromEvent(target, 'test');

    stream.take(1).addListener({
      next: (x) => {},
      error: (err: any) => done(err),
      complete() {
        setTimeout(() => {
          assert.strictEqual(target.removedEvent, 'test');
          done();
        }, 5);
      }
    });

    target.emit( 'test', 1 );
    target.emit( 'test', 2 );
  });

  it('should aggregate arguments from emitters', (done: any) => {
    const target = new FakeEventEmitter();
    const stream = fromEvent(target, 'test').take(2);

    let expected = [[1, 'foo', true], [2, 'bar', false]];

    stream.addListener({
      next: (x: any) => {
        assert.deepEqual(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.strictEqual(expected.length, 0);
        done();
      }
    });

    target.emit( 'test', 1, 'foo', true );
    target.emit( 'test', 2, 'bar', false );
  });
});
