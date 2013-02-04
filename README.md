Paperboy
===========

An event emitter and mixin with advanced features that don't get in the way.

[![browser support](http://ci.testling.com/sakabako/paperboy.png)](http://ci.testling.com/sakabako/paperboy)

## Basic Usage

```javascript
var myObject = {'foo':'bar'};

var trigger = paperboy.mixin( myObject );

myObject.on('myevent', function( howMany ) {
	console.log( howMany ); // 5
	console.log( this ); // myObject
});

trigger('myevent', 5);
```

## Methods

* `var trigger = paperboy.mixin( target )` - Adds `on`, `one`, and `off` to `target`. Returns the `trigger` function.
* `paperboy.emitter()` -  Returns a new object with `on`, `one`, `off`, and `trigger` functions.

_NOTE: `paperboy.mixin` returns the trigger function. It does not add it to the target._

## Whitelisting Events

To catch errors early, before they hit production, you can whitelist event names. If anyone tries to add to or trigger events that are not white listed an error will be thrown.

```javascript
// with a mixin
var target = {};
var trigger = paperboy.mixin( target, ['eventOne', 'eventTwo']);

// with an emitter
var emitter = paperboy.emitter(['eventOne', 'eventTwo']);

emitter.on('eventOne', function(){}); // works
emitter.on('eventOen', function(){}); // throws an error
```

## Stateful Events

You can create stateful events that operate similar to `$(document).ready()`. When a listener is added to a stateful event it is triggered immediately if your emitter is in that state.

All of the emitter functions have two properties, `enter` and `exit`. Calling `trigger.enter` or `trigger.exit` sets the state of the emitter and triggers events applied with `emitter.on.enter` or `emitter.on.exit`.


```javascript
emitter.on.enter('live', function(){}); // does not fire immediately.
emitter.trigger.enter('live'); // fires the listener above.
emitter.on.enter('live', function(){}); // fires immedately

emitter.trigger.exit('live'); // takes the emitter out of the live state.
emitter.trigger.enter('live'); // fires both listeners
```

## Chaining Emitters

You can have a paperboy emitter repeat the events triggered by other emitters. This is done with the `repeat` property of the `trigger` function.

```javascript
// This will cause `emitter` to echo every event that `otherPaperboyEmitter` triggers.
emitter.trigger.repeat( otherPaperboyEmitter );

// This will cause `emitter` to echo specific events that `otherEmitter` throws.
// You can even repeat events from jQuery objects or anything else with an `on` function.
emitter.trigger.repeat( otherEmitter, ['pickup', 'putdown'] );
emitter.trigger.repeat( $('.button'), ['click'] );
emitter.trigger.repeat( backboneModel, ['update'] );
```

If you want to repeat stateful events this must be done separately.
```javascript
emitter.trigger.repeatStates( otherPaperboyEmitter /*, [optional, event, names] */);
```

## The Magic `*` Event

Listeners applied to the `*` event will be triggered for each event. The first argument will be the event name.

## Emitter Details

Emitters trigger event listeners. The `mixin` function turns any object into an emitter.

* `emitter.on( eventName, callback )` - adds a listener to the `eventName` event. `eventName` must be a string.
* `emitter.off( eventName, callback )` - removes a listener from an event.
* `emitter.one( eventName, callback )` - adds a listener that will remove itself after being triggered once.
* `emitter.trigger( eventName /*, additional, arguments */ )` - triggeres all event handlers for `eventName`.
* `emitter.trigger.repeat( otherEmitter /*, [eventNames] */ )` - Causes this emitter to repeat events triggered on another emitter.

NOTE: `trigger` is not added by the mixin function. If you want trigger to be public you must attach it to the target yourself.

## Why Paperboy?

* Event listeners are always kept private.
* Passing in a whitelist of event names can prevent bugs.
* The `trigger` function is private by default, making it easier to write safe code. If you want it to be public simply add it to the target.
* Removing a listener in a callback will not cause it to skip the next listener.
* It's small, 1k minified and gzipped.

Inspired by [LucidJS](https://github.com/RobertWHurst/LucidJS)
