
- Only 18 core operators
- Written in TypeScript
- 26 kB standard size, 20 kB minified, 3 kB gzipped
- In average, faster than RxJS 4, RxJS 5, Kefir, Bacon.js

# Installation

{% highlight text %}
npm install xstream
{% endhighlight %}

Cycle's core abstraction is your application as a pure function `main()` where inputs are read effects (*sources*) from the external world and outputs (*sinks*) are write effects to affect the external world. These side effects in the external world are managed by *drivers*: plugins that handle DOM effects, HTTP effects, etc.

The internals of `main()` are built using Reactive programming primitives, which maximizes separation of concerns, providing a clean and fully declarative way of organizing your code. The *dataflow* is plainly visible, making it easy to read and understand the code.

## Example

{% highlight text %}
npm install rx @cycle/core @cycle/dom
{% endhighlight %}

{% highlight js %}
import Cycle from '@cycle/core';
import {div, label, input, hr, h1, makeDOMDriver} from '@cycle/dom';

function main(sources) {
  const sinks = {
    DOM: sources.DOM.select('.field').events('input')
      .map(ev => ev.target.value)
      .startWith('')
      .map(name =>
        div([
          label('Name:'),
          input('.field', {attributes: {type: 'text'}}),
          hr(),
          h1('Hello ' + name),
        ])
      )
  };
  return sinks;
}

Cycle.run(main, { DOM: makeDOMDriver('#app-container') });
{% endhighlight %}


# Functional and Reactive

Functional means "clean", and Reactive means "separated". Cycle.js apps are made of pure functions, which means you know they simply take inputs and generate outputs, without performing any side effects. The building blocks are Observables from [RxJS](https://github.com/Reactive-Extensions/RxJS), a Reactive programming library which simplifies code related to events, asynchrony, and errors. Structuring the application with RxJS also separates concerns, because all [dynamic updates to a piece of data are co-located](/observables.html#reactive-programming) and impossible to change from outside. As a result, apps in Cycle are entirely `this`-less and have nothing comparable to imperative calls such as `setState()` or `foo.update()`.

## Simple and Concise

Cycle.js is a framework with very few concepts to learn. The core API has just one function: `run(app, drivers)`. Besides that, there are **Observables**, **functions**, **drivers** (plugins for different types of side effects), and a helper function to isolate scoped components. This is a framework with very little amount of "magic". Most of the building blocks are just JavaScript functions. Usually the lack of "magic" leads to very verbose code, but since RxJS Observables are able to build complex dataflows with a few operations, you will come to see how apps in Cycle.js are small and readable.

## Extensible and Testable

Drivers are plugin-like simple functions that take messages from sinks and call imperative functions. All side effects are contained in drivers. This means your application is just a pure function, and it becomes easy to swap drivers around. The community has built drivers for [React Native](https://github.com/cyclejs/cycle-react-native), [HTML5 Notification](https://github.com/cyclejs/cycle-notification-driver), [Socket.io](https://github.com/cgeorg/cycle-socket.io), etc. Sources and sinks can be easily used as [Adapters and Ports](https://iancooper.github.io/Paramore/ControlBus.html). This also means testing is mostly a matter of feeding inputs and inspecting the output. No deep mocking needed. Your application is just a pure transformation of data.

## Explicit dataflow

In every Cycle.js app, each of the Observable declarations is a node in a dataflow graph, and the dependencies between declarations are arrows. This means there is a one-to-one correspondence between your code and *minimap*-like graph of the dataflow between external inputs and external outputs.

In many frameworks the flow of data is *implicit*: you need to build a mental model of how data moves around in your app. In Cycle.js, the flow of data is clear by reading your code.

## Composable

Cycle.js has components, but unlike other frameworks, every single Cycle.js app, no matter how complex, is a function that can be reused in a larger Cycle.js app.

Sources and sinks are the interface between the application and the drivers, but they are also the interface between a child component and its parent. Cycle.js components can be simply GUI widgets like in other frameworks, but they are not limited to GUIs only. You can make Web Audio components, network requests components, and others, since the sources/sinks interface is not exclusive to the DOM.

## Learn it in 1h 37min

Got 1 hour and 37 minutes? That is all it takes to learn the essentials of Cycle.js. Watch [**this free Egghead.io video course**](https://egghead.io/series/cycle-js-fundamentals) given by the creator of Cycle.js. Understand Cycle.js from within by following how it is built from scratch, then learn how to transform your ideas into applications.

## Supports...

- [**Virtual DOM rendering**](https://github.com/cyclejs/dom)
- [**Server-side rendering**](https://github.com/cyclejs/examples/tree/master/isomorphic)
- [**JSX**](http://cycle.js.org/getting-started.html)
- [**React Native**](https://github.com/cyclejs/cycle-react-native)
- [**Time travelling**](https://github.com/cyclejs/cycle-time-travel)
- [**Routing with the History API**](https://github.com/cyclejs/history)
- [**And more...**](https://github.com/vic/awesome-cyclejs)
