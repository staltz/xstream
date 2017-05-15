/// <reference types="mocha"/>
/// <reference types="node" />
import * as assert from 'assert';
import xs from '../../src/index';
import uniqueBy from '../../src/extra/uniqueBy';

const head = <T>(arr: [T]) => arr[0];

describe('uniqueBy (extra)', () => {

	it('should emit only unique objects', (done) => {
		const source = xs.of([1], [2], [3], [4], [3], [2], [1], [5]);
		const out = source.compose(uniqueBy(head));
		const expected = [[1], [2], [3], [4], [5]];
		const actual = [];

		out.addListener({
			next(a) {
				assert.deepEqual(a, expected.shift());
			},
			error(e) {
				done(e);
			},
			complete() {
				assert.equal(expected.length, 0);
				done();
			}
		});
	});

	it('should throw when source throws', (done) => {
		const source = xs.create({
			start(listener) {
				listener.error('boom!');
			},
			stop() {
			}
		});
		const out = source.compose(uniqueBy(head));

		out.addListener({
			next() {
				done('should not emit');
			},
			error(e) {
				assert.ok(e);
				done();
			},
			complete() {
				done('should not complete');
			}
		});
	});

});
