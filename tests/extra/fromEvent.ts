import xs from '../../src/index';
import fromEvent from '../../src/extra/fromEvent';
import * as assert from 'assert';
function noop() {};

class FakeEventTarget implements EventTarget {
  public handler: EventListener;
  public event: string;
  public capture: boolean;
  public removedEvent: string;
  public removedCapture: boolean;

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

    this.handler = this.event = this.capture = void 0;
  }

  dispatchEvent(event: Event) {
    return true;
  }
};

describe('fromEvent (extra)', () => {
  it('should call addEventListener with expected parameters', () => {
    const target = new FakeEventTarget();
    const stream = fromEvent(target, 'test', true);

    stream.addListener({next: noop, error: noop, complete: noop});

    assert.strictEqual('test', target.event);
    assert.strictEqual(true, target.capture);
  });

  it('should call addEventListener with expected parameters', () => {
    const target = new FakeEventTarget();
    const stream = fromEvent(target, 'test');

    stream.addListener({next: noop, error: noop, complete: noop});

    assert.strictEqual('test', target.event);
    assert.strictEqual(false, target.capture);
  });

  it('should propagate events', (done) => {
    const target = new FakeEventTarget();
    const stream = fromEvent(target, 'test').take(3);

    let expected = [1, 2, 3];

    const listener = {
      next(x: any) {
        assert.strictEqual(x, expected.shift());
      },
      error: done,
      complete: () => {
        assert.strictEqual(expected.length, 0);
        done();
      }
    };

    stream.addListener(listener);

    target.emit(1);
    target.emit(2);
    target.emit(3);
    target.emit(4);
  });

  it('should call removeEventListener with expected parameters', (done) => {
    const target = new FakeEventTarget();
    const stream = fromEvent(target, 'test', true);

    stream.take(1).addListener({
      next(x) {},
      error: done,
      complete() {
        setTimeout(() => {
          assert.strictEqual('test', target.removedEvent);
          assert.strictEqual(true, target.removedCapture);
          done();
        }, 5);
      }
    });

    target.emit(1);
    target.emit(2);
  });
});
