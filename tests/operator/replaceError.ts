import xs, {Producer} from '../../src/index';
import * as assert from 'assert';

describe('Stream.prototype.replaceError', () => {
  it('should replace a single error with an array stream', (done) => {
    const source = xs.of<any>('a', 'b', 'c', 2, 'd').map(i => i.toLowerCase());
    const other = xs.of(10, 20, 30);
    const stream = source.replaceError(err => other);
    const expected = ['a', 'b', 'c', 10, 20, 30];

    stream.addListener({
      next: (x: any) => {
        assert.equal(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });

  it('should allow retrying on a hot producer', (done) => {
    const events: Array<{type: string, value?: any}> = [
      {type: 'next', value: 10},
      {type: 'next', value: 20},
      {type: 'next', value: 30},
      {type: 'error', value: '#'},
      {type: 'next', value: 40},
      {type: 'next', value: 50},
      {type: 'error', value: '##'},
      {type: 'next', value: 60},
      {type: 'complete'},
    ];

    const source = xs.create({
      start: (listener) => {
        while (events.length > 0) {
          const event = events.shift();
          switch (event.type) {
            case 'next': listener.next(event.value); break;
            case 'error': listener.error(event.value); return;
            case 'complete': listener.complete(); return;
            default: done('not supposed to happen');
          }
        }
      },
      stop: () => void 0,
    });

    const stream = source.replaceError(err => source);
    const expected = [10, 20, 30, 40, 50, 60];

    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });

  it('should repeat a cold producer if retrying', (done) => {
    const events: Array<{type: string, value?: any}> = [
      {type: 'next', value: 10},
      {type: 'next', value: 20},
      {type: 'next', value: 30},
      {type: 'error', value: '#'},
      {type: 'next', value: 40},
      {type: 'next', value: 50},
      {type: 'error', value: '##'},
      {type: 'next', value: 60},
      {type: 'complete'},
    ];
    const source = xs.create(<Producer<number>> {
      on: false,
      start: (listener) => {
        this.on = true;
        for (let i = 0; i < events.length; i++) {
          if (!this.on) return;
          const event = events[i];
          switch (event.type) {
            case 'next': listener.next(event.value); break;
            case 'error': listener.error(event.value); this.on = false; return;
            case 'complete': listener.complete(); this.on = false; return;
            default: done('not supposed to happen');
          }
        }
      },
      stop: () => {
        this.on = false;
      },
    });

    const stream = source.replaceError(err => source).take(8);
    const expected = [10, 20, 30, 10, 20, 30, 10, 20];

    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      },
    });
  });

  it('should propagate user mistakes in replace() as errors', (done) => {
    const source = xs.throw({message: 'oops'});
    const stream = source.replaceError(
      err => xs.of((<string> err).toLowerCase())
    );

    stream.addListener({
      next: (s: string) => done('next should not be called'),
      error: (err) => {
        assert.notStrictEqual(err.message.match(/is not a function$/), null);
        done();
      },
      complete: () => {
        done('complete should not be called');
      },
    });
  });
  
  it('should support retry for async stream', (done) => {
    const expected = ['hi'];
    let id: any = null, i = 0;
    const response = xs.create({
      start: function (p) {
        id = setTimeout(() => { 
          if (i++ === 0) {
            p.error(new Error('oops'));
          } else {
            p.next('hi');
            p.complete();
          } 
        }, 10);
      },
      stop: function () { 
        id && clearTimeout(id); 
      }
    })
 
    response.replaceError(() => response).addListener({
      next: x => {
        assert.equal(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      }
    })
  })
});
