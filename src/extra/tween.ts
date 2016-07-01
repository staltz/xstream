import {Stream} from '../core';
import concat from './concat';

export type Ease = (x: number, from: number, to: number) => number;
export type Easings = {
  easeIn: Ease;
  easeOut: Ease;
  easeInOut: Ease;
}

export type NumericFunction = (input: number) => number;

export interface TweenConfig {
  from: number;
  to: number;
  duration: number;
  ease?: Ease;
  interval?: number;
}

function interpolate(y: number, from: number, to: number): number {
  return (from * (1 - y) + to * y);
}

function flip(fn: NumericFunction): NumericFunction {
  return x => 1 - fn(1 - x);
}

function createEasing(fn: NumericFunction): Easings {
  let fnFlipped = flip(fn);
  return {
    easeIn(x, from, to) {
      return interpolate(fn(x), from, to);
    },
    easeOut(x, from, to) {
      return interpolate(fnFlipped(x), from, to);
    },
    easeInOut(x, from, to) {
      const y = (x < 0.5) ?
        (fn(2 * x) * 0.5) :
        (0.5 + fnFlipped(2 * (x - 0.5)) * 0.5);
      return interpolate(y, from, to);
    }
  };
};

let easingPower2 = createEasing(x => x * x);
let easingPower3 = createEasing(x => x * x * x);
let easingPower4 = createEasing(x => {
  const xx = x * x;
  return xx * xx;
});

const EXP_WEIGHT = 6;
const EXP_MAX = Math.exp(EXP_WEIGHT) - 1;
function expFn(x: number): number {
  return (Math.exp(x * EXP_WEIGHT) - 1) / EXP_MAX;
}
let easingExponential = createEasing(expFn);

const OVERSHOOT = 1.70158;
let easingBack = createEasing(x => x * x * ((OVERSHOOT + 1) * x - OVERSHOOT));

const PARAM1 = 7.5625;
const PARAM2 = 2.75;
function easeOutFn(x: number): number {
  let z = x;
  if (z < 1 / PARAM2) {
    return (PARAM1 * z * z);
  } else if (z < 2 / PARAM2) {
    return (PARAM1 * (z -= 1.5 / PARAM2) * z + 0.75);
  } else if (z < 2.5 / PARAM2) {
    return (PARAM1 * (z -= 2.25 / PARAM2) * z + 0.9375);
  } else {
    return (PARAM1 * (z -= 2.625 / PARAM2) * z + 0.984375);
  }
}
let easingBounce = createEasing(x => 1 - easeOutFn(1 - x));

let easingCirc = createEasing(x => -(Math.sqrt(1 - x * x) - 1));

const PERIOD = 0.3;
const OVERSHOOT_ELASTIC = PERIOD / 4;
const AMPLITUDE = 1;
function elasticIn(x: number): number {
  let z = x;
  if (z <= 0) {
    return 0;
  } else if (z >= 1) {
    return 1;
  } else {
    z -= 1;
    return -(AMPLITUDE * Math.pow(2, 10 * z))
      * Math.sin((z - OVERSHOOT_ELASTIC) * (2 * Math.PI) / PERIOD);
  }
}
let easingElastic = createEasing(elasticIn);

const HALF_PI = Math.PI * 0.5;
let easingSine = createEasing(x => 1 - Math.cos(x * HALF_PI));

const DEFAULT_INTERVAL: number = 15;

export interface TweenFactory {
  (config: TweenConfig): Stream<number>;
  linear: { ease: Ease };
  power2: Easings;
  power3: Easings;
  power4: Easings;
  exponential: Easings;
  back: Easings;
  bounce: Easings;
  circular: Easings;
  elastic: Easings;
  sine: Easings;
}

/**
 * Creates a stream of numbers emitted in a quick burst, following a numeric
 * function like sine or elastic or quadratic. tween() is meant for creating
 * streams for animations.
 *
 * Example:
 *
 * ```js
 * import tween from 'xstream/extra/tween'
 *
 * const stream = tween({
 *   from: 20,
 *   to: 100,
 *   ease: tween.exponential.easeIn,
 *   duration: 1000, // milliseconds
 * })
 *
 * stream.addListener({
 *   next: (x) => console.log(x),
 *   error: (err) => console.error(err),
 *   complete: () => console.log('concat completed'),
 * })
 * ```
 *
 * The stream would behave like the plot below:
 *
 * ```text
 * 100                  #
 * |
 * |
 * |
 * |
 * 80                  #
 * |
 * |
 * |
 * |                  #
 * 60
 * |
 * |                 #
 * |
 * |                #
 * 40
 * |               #
 * |              #
 * |            ##
 * |         ###
 * 20########
 * +---------------------> time
 * ```
 *
 * Provide a configuration object with **from**, **to**, **duration**, **ease**,
 * **interval** (optional), and this factory function will return a stream of
 * numbers following that pattern. The first number emitted will be `from`, and
 * the last number will be `to`. The numbers in between follow the easing
 * function you specify in `ease`, and the stream emission will last in total
 * `duration` milliseconds.
 *
 * The easing functions are attached to `tween` too, such as
 * `tween.linear.ease`, `tween.power2.easeIn`, `tween.exponential.easeOut`, etc.
 * Here is a list of all the available easing options:
 *
 * - `tween.linear` with ease
 * - `tween.power2` with easeIn, easeOut, easeInOut
 * - `tween.power3` with easeIn, easeOut, easeInOut
 * - `tween.power4` with easeIn, easeOut, easeInOut
 * - `tween.exponential` with easeIn, easeOut, easeInOut
 * - `tween.back` with easeIn, easeOut, easeInOut
 * - `tween.bounce` with easeIn, easeOut, easeInOut
 * - `tween.circular` with easeIn, easeOut, easeInOut
 * - `tween.elastic` with easeIn, easeOut, easeInOut
 * - `tween.sine` with easeIn, easeOut, easeInOut
 *
 * @factory true
 * @param {TweenConfig} config An object with properties `from: number`,
 * `to: number`, `duration: number`, `ease: function` (optional, defaults to
 * linear), `interval: number` (optional, defaults to 15).
 * @return {Stream}
 */
function tween({
  from,
  to,
  duration,
  ease = tweenFactory.linear.ease,
  interval = DEFAULT_INTERVAL
}): Stream<number> {
  const totalTicks = Math.round(duration / interval);
  return Stream.periodic(interval)
    .take(totalTicks)
    .map(tick => ease(tick / totalTicks, from, to))
    .compose(s => concat<number>(s, Stream.of(to)));
}

const tweenFactory: TweenFactory = <TweenFactory> tween;

tweenFactory.linear = { ease: interpolate };
tweenFactory.power2 = easingPower2;
tweenFactory.power3 = easingPower3;
tweenFactory.power4 = easingPower4;
tweenFactory.exponential = easingExponential;
tweenFactory.back = easingBack;
tweenFactory.bounce = easingBounce;
tweenFactory.circular = easingCirc;
tweenFactory.elastic = easingElastic;
tweenFactory.sine = easingSine;

export default tweenFactory;
