/* 
Copyright 2013 Stu Kabakoff
https://github.com/sakabako/paperboy
MIT Licensed
*/
(function(factory) {

	//AMD
	if(typeof define === 'function' && define.amd) {
		define(factory);

	//NODE
	} else if(typeof module === 'object' && module.exports) {
		module.exports = factory();

	//GLOBAL
	} else {
		window.paperboy = factory();
	}

})(function() {
	"use strict";

	var exports = {};
	var aps = Array.prototype.slice;
	
	function indexOf( array, item ) {
		for( var i = 0; i < array.length; i += 1 ) {
			if (array[i] === item) {
				return i;
			}
		}
		return -1;
	}

	var errorLogFn = window.console && console.error ? 'error' : 'log';
	function logError( type, error, functionWithError ) {
		if (window.console) {
			console[errorLogFn]('Error in callback for '+type+' event. '+error.message);
			console.log(error);
			// inspect functionWithError to see which function it is.
			// Firefox has error.lineNumber and error.fileName.
			// Chrome has error.stack.
		}
	}
	
	exports.mixin = function( target, eventTypes, stateTypes ){
		
		var events = {'*':[]};
		var enforceTypes = !!eventTypes;

		var isStateCallbacks = {'*':[]};
		var notStateCallbacks = {'*':[]};
		var stateStatuses = {};
		var stateArguments = {};
		var enforceStates = !!stateTypes;
		
		if (eventTypes) {
			for (var i = 0; i < eventTypes.length; i += 1) {
				events[eventTypes[i]] = [];
			}
		}

		if (stateTypes) {
			for (var i = 0; i < stateTypes.length; i += 1) {
				isStateCallbacks[stateTypes[i]] = [];
				notStateCallbacks[stateTypes[i]] = [];
			}
		}
		
		function error( triedTo, eventName ) {
			throw new Error('tried to '+triedTo+' a non-existent event type: '+eventName+'. Options are: '+eventTypes.join(', '));
		}

		// Acutal implementations of on/off/trigger
		function addCallback( callbackContainer, enforced, type, callback, isOne ) {
			isOne = !!isOne;
			if (enforced && !callbackContainer[type]) {
				error( 'add', type );
			} else if (!callbackContainer[type]) {
				callbackContainer[type] = [];
			}
			callbackContainer[type].push({callback: callback, isOne: isOne});
		}

		function removeCallback( callbackContainer, enforced, type, callback ) {
			if (enforced && !callbackContainer[type]) {
				error( 'remove', type );
			} else if (!callbackContainer[type]) {
				return;
			}
			for (var i = 0, callbackObj; callbackObj = callbackContainer[type][i]; i += 1) {
				if (callbackObj.callback === callback) {
					callbackContainer[type].splice(i, 1);
					return;
				}
			}
		}

		function triggerCallbacks( callbackContainer, enforced, args ) {
			var type = args[0];
			if (enforced && !callbackContainer[type]) {
				error( 'trigger', type );
			} else if (!callbackContainer[type] && callbackContainer['*'].length === 0) {
				return;
			}
			// trigger all * events
			var callbacks = callbackContainer['*'].slice();
			for (var i = 0; i < callbacks.length; i++){
				try {
					callbacks[i].callback.apply(target, args);
				} catch (e) {
					logError( '*', e, callbacks[i].callback );

				}
				if (callbacks[i].isOne) {
					target.off(type, callbacks[i].callback);
				}
			}
			// trigger listeners for this type, if any
			if (callbackContainer[type]) {
				args.shift();
				callbacks = callbackContainer[type].slice();
				for (var i = 0; i < callbacks.length; i++){
					try {
						callbacks[i].callback.apply(target, args);
					} catch (e) {
						logError( type, e, callbacks[i].callback );
					}
					if (callbacks[i].isOne) {
						removeCallback( callbackContainer, false, type, callbacks[i].callback);
					}
				}
			}			
		}

		// Normal on/off
		target.on = function( type, callback, isOne ) {
			addCallback( events, enforceTypes, type, callback, isOne );
		};
		target.one = function (type, callback) {
			target.on(type, callback, true);
		};
		target.off = target.on.remove = function( type, callback ) {
			removeCallback( events, enforceTypes, type, callback );
		};


		// is in stateful events
		target.is = function( type, callback, isOne ) {
			if (stateStatuses[type]) {
				callback.apply( target, stateArguments[type] );
				if (isOne) {
					return;
				}
			}
			addCallback( isStateCallbacks, enforceStates, type, callback, isOne );
		};
		target.is.one = function( type, callback ) {
			target.is( type, callback, true );
		};
		target.is.remove = function (type, callback) {
			removeCallback( isStateCallbacks, enforceTypes, type, callback );
		};

		// is not in stateful events
		target.not = function( type, callback, isOne ) {
			if (!stateStatuses[type]) {
				callback.apply( target, stateArguments[type] || [] );
				if (isOne) {
					return;
				}
			}
			addCallback( notStateCallbacks, enforceStates, type, callback, isOne );
		};
		target.not.one = function( type, callback ) {
			target.not( type, callback, true );
		};
		target.not.remove = function( type, callback ) {
			removeCallback( notStateCallbacks, enforceTypes, type, callback );
		};


		// triggering
		var trigger = function ( /* type, args... */ ){
			var args = aps.call( arguments );
			triggerCallbacks( events, enforceTypes, args );
		};
		trigger.is = function(type /*, args */) {
			if (stateStatuses[type]) { return; }
			var args = aps.call(arguments);
			stateStatuses[type] = true;
			stateArguments[type] = args.slice(1);
			triggerCallbacks( isStateCallbacks, enforceStates, args );
		};
		trigger.not = function(type /*, args */) {
			if (!stateStatuses[type]) { return; }
			var args = aps.call(arguments);
			stateStatuses[type] = false;
			stateArguments[type] = args.slice(1);
			triggerCallbacks( notStateCallbacks, enforceStates, args );
		};

		// checks to see if an emitter accepts events.
		// this helps repeaters throw meaningful errors.
		target.on.accepts = function( eventName ) {
			if (enforceTypes) {
				return indexOf( eventTypes, eventName) !== -1;
			} else {
				return true;
			}
		};
		target.is.accepts = function( stateName ) {
			if (enforceStates) {
				return indexOf( stateTypes, stateName) !== -1;
			} else {
				return true;
			}
		};

		
		// Repeating
		trigger.repeat = function( emitter, events, states ) {
			if (events) {
				for (var i = 0; i < events.length; i += 1 ) {
					// if it's not a paperboy emitter, or is a paperboy emitter that supports this event
					if (!target.on.accepts || target.on.accepts(events[i])) {
						(function( eventName ) {
							emitter.on(eventName, function() {
								var args = aps.call(arguments);
								args.unshift(eventName);
								trigger.apply( target, args );
							});
						})(events[i]);
					} else {
						error( 'repeat', events[i] );
					}
				}
			} else {
				emitter.on('*', function () {
					trigger.apply( target, arguments );
				});
			}
			if (states) {
				for (var i = 0; i < states.length; i += 1) {
					if (target.is.accepts(states[i])) {
						(function (stateName) {
							emitter.is(stateName, function() {
								var args = aps.call(arguments);
								args.unshift(stateName);
								trigger.is.apply( target, args );
							});
							emitter.not(stateName, function() {
								var args = aps.call(arguments);
								args.unshift(stateName);
								trigger.not.apply( target, args );
							});
						})(states[i]);
					} else {
						error( 'repeat state', events[i] );
					}
				}
			} else if (states !== false && emitter.is && emitter.is.accepts) {
				emitter.is('*', function () {
					trigger.is.apply( target, arguments );
				});
				emitter.not('*', function () {
					trigger.not.apply( target, arguments );
				});
			}
		};
		
		return trigger;
	};
	
	exports.emitter = function( eventTypes ) {
		var emitter = {};
		emitter.trigger = exports.mixin(emitter, eventTypes);
		return emitter;
	};
	
	return exports;
});
