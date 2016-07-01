/// <reference path="../../typings/globals/mocha/index.d.ts" />
/// <reference path="../../typings/globals/node/index.d.ts" />
import xs, {Stream} from '../../src/index';
import tween from '../../src/extra/tween';
import * as assert from 'assert';

const STEPS = 20;
const DURATION = 1000;

const plotTweenConfigs = {
  from: 0,
  to: STEPS,
  duration: DURATION,
  interval: DURATION / STEPS
};

function setCharAt(str: string, idx: number, chr: string): string {
  if (idx > str.length - 1){
    return str.toString();
  } else {
    return str.substr(0, idx) + chr + str.substr(idx + 1);
  }
}

function rotate(lines: Array<string>): Array<string> {
  let len = lines[0].length;
  return lines[0].split('')
    .map((col, i) =>
      lines
        .map(row => row.split('')[len-i-1])
    )
    .map(row => row.join(''));
}

function stutter(char: string, length: number): string {
  return new Array(length + 1).join(char);
}

function plot(position$: Stream<number>): Stream<string> {
  return position$
    .fold((acc, curr) => {
      acc.push(curr);
      return acc;
    }, [])
    .last()
    .map(arr => {
      let coords = arr.map((y, x) => [x, y]);
      let lines = coords.reduce((lines, [x, y]) => {
        let newline: string;
        if (y < 0) {
          newline = setCharAt(stutter(' ', STEPS + 1), 0, '_');
        } else {
          newline = setCharAt(stutter(' ', STEPS + 1), Math.round(y), '#');
        }
        lines.push(newline);
        return lines;
      }, []);
      return rotate(lines)
        .map(line => '|'.concat(line.replace(/ *$/g, '')).concat('\n'))
        .reduce((lines, line) => lines.concat(line), '')
        .concat('+' + stutter('-', STEPS + 1));
    });
}

function makeAssertPlot(done: MochaDone, assert: any, expected: string) {
  return {
    next: function assertPlot(actual: string) {
      assert.equal('\n' + actual, expected);
    },
    error: (err: any) => done(err),
    complete: () => {
      done();
    },
  };
}

describe('tween (extra)', () => {
  it('should do linear tweening', (done) => {
    let position$ = tween({
      ease: tween.linear.ease,
      from: plotTweenConfigs.from,
      to: plotTweenConfigs.to,
      duration: plotTweenConfigs.duration,
      interval: plotTweenConfigs.interval,
    });
    plot(position$).addListener(makeAssertPlot(done, assert, `
|                    #
|                   #
|                  #
|                 #
|                #
|               #
|              #
|             #
|            #
|           #
|          #
|         #
|        #
|       #
|      #
|     #
|    #
|   #
|  #
| #
|#
+---------------------`));
  });

  it('should do power of 2 easing (ease in)', (done) => {
    let position$ = tween({
      ease: tween.power2.easeIn,
      from: plotTweenConfigs.from,
      to: plotTweenConfigs.to,
      duration: plotTweenConfigs.duration,
      interval: plotTweenConfigs.interval,
    });
    plot(position$).addListener(makeAssertPlot(done, assert, `
|                    #
|
|                   #
|
|                  #
|
|                 #
|                #
|
|               #
|              #
|
|             #
|            #
|           #
|          #
|         #
|        #
|      ##
|    ##
|####
+---------------------`));
  });

  it("should do power of 3 easing (ease in)", function (done) {
    let position$ = tween({
      ease: tween.power3.easeIn,
      from: plotTweenConfigs.from,
      to: plotTweenConfigs.to,
      duration: plotTweenConfigs.duration,
      interval: plotTweenConfigs.interval,
    });
    plot(position$).addListener(makeAssertPlot(done, assert, `
|                    #
|
|
|                   #
|
|                  #
|
|
|                 #
|
|                #
|
|               #
|              #
|
|             #
|            #
|          ##
|         #
|      ###
|######
+---------------------`));
  });

  it("should do power of 4 easing (ease in)", function (done) {
    let position$ = tween({
      ease: tween.power4.easeIn,
      from: plotTweenConfigs.from,
      to: plotTweenConfigs.to,
      duration: plotTweenConfigs.duration,
      interval: plotTweenConfigs.interval,
    });
    plot(position$).addListener(makeAssertPlot(done, assert, `
|                    #
|
|
|
|                   #
|
|
|                  #
|
|
|                 #
|
|                #
|
|               #
|              #
|             #
|            #
|           #
|        ###
|########
+---------------------`));
  });

  it("should do exponential easing (ease in)", function (done) {
    let position$ = tween({
      ease: tween.exponential.easeIn,
      from: plotTweenConfigs.from,
      to: plotTweenConfigs.to,
      duration: plotTweenConfigs.duration,
      interval: plotTweenConfigs.interval,
    });
  plot(position$).addListener(makeAssertPlot(done, assert, `
|                    #
|
|
|
|
|                   #
|
|
|
|                  #
|
|
|                 #
|
|                #
|
|               #
|              #
|            ##
|         ###
|#########
+---------------------`));
  });

  it("should do back easing (ease in)", function (done) {
    let position$ = tween({
      ease: tween.back.easeIn,
      from: plotTweenConfigs.from,
      to: plotTweenConfigs.to,
      duration: plotTweenConfigs.duration,
      interval: plotTweenConfigs.interval,
    });
    plot(position$).addListener(makeAssertPlot(done, assert, `
|                    #
|
|
|
|                   #
|
|
|
|                  #
|
|
|                 #
|
|
|                #
|
|               #
|
|              #
|
|#____________#
+---------------------`));
  });

  it("should do bounce easing (ease in)", function (done) {
    let position$ = tween({
      ease: tween.bounce.easeIn,
      from: plotTweenConfigs.from,
      to: plotTweenConfigs.to,
      duration: plotTweenConfigs.duration,
      interval: plotTweenConfigs.interval,
    });
    plot(position$).addListener(makeAssertPlot(done, assert, `
|                   ##
|
|                  #
|                 #
|
|
|                #
|
|
|               #
|
|
|
|
|              #
|        ###
|           #
|       #
|            #
|   ####      #
|###
+---------------------`));
  });

  it("should do circular easing (ease in)", function (done) {
    let position$ = tween({
      ease: tween.circular.easeIn,
      from: plotTweenConfigs.from,
      to: plotTweenConfigs.to,
      duration: plotTweenConfigs.duration,
      interval: plotTweenConfigs.interval,
    });
    plot(position$).addListener(makeAssertPlot(done,assert, `
|                    #
|
|
|
|
|
|                   #
|
|
|                  #
|
|                 #
|                #
|               #
|              #
|             #
|            #
|          ##
|        ##
|     ###
|#####
+---------------------`));
  });

  it("should do elastic easing (ease in)", function (done) {
    let position$ = tween({
      ease: tween.elastic.easeIn,
      from: plotTweenConfigs.from,
      to: plotTweenConfigs.to,
      duration: plotTweenConfigs.duration,
      interval: plotTweenConfigs.interval,
    });
    plot(position$).addListener(makeAssertPlot(done,assert, `
|                    #
|
|
|
|
|
|
|
|
|
|
|
|
|                   #
|
|
|
|
|              ##
|             #
|####___###___   ___
+---------------------`));
  });

  it("should do sine easing (ease in)", function (done) {
    let position$ = tween({
      ease: tween.sine.easeIn,
      from: plotTweenConfigs.from,
      to: plotTweenConfigs.to,
      duration: plotTweenConfigs.duration,
      interval: plotTweenConfigs.interval,
    });
    plot(position$).addListener(makeAssertPlot(done, assert, `
|                    #
|
|                   #
|                  #
|
|                 #
|                #
|
|               #
|              #
|             #
|
|            #
|           #
|          #
|         #
|        #
|       #
|     ##
|   ##
|###
+---------------------`));
  });
});