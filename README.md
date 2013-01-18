Paperboy
===========

A simple event emitter and mixin.

## Basic Usage

```javascript

var myObject = {'foo':'bar'};

var trigger = paperboy.mixin( myObject );

myObject.on('myevent', function() {
	console.log( this ); // myObject
})

```

## Methods

* `paperboy.mixin( target /*, [eventNames]*/ )`
 * Adds `on`, `one`, and `off` to `target`.
 * Returns the trigger function.
 * If an array of event names is passed it will be used as a whitelist of event names. An error will be thrown for anything different.
* `paperboy.emitter( /*[eventNames]*/ )`
 * Returns a new object with `on`, `one`, `off`, and `trigger` functions.

## Why Paperboy?

* Event listeners are always kept private.
* Passing in a whitelist of event names can prevent bugs.
* The `trigger` function is private by default, making it easier to write safe code. If you want it to be public simply add it to the target.
* Removing a listener in a callback will not cause it to skip the next listener.
* It's small, about 500 bytes minified and gzipped.