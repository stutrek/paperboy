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
	
	exports.mixin = function( target, eventTypes, stateTypes ){
		
		var events = {'*':[]};
		var enforceTypes = !!eventTypes;

		var enterStateCallbacks = {'*':[]};
		var exitStateCallbacks = {'*':[]};
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
				enterStateCallbacks[stateTypes[i]] = [];
				exitStateCallbacks[stateTypes[i]] = [];
			}
		}
		
		function error( triedTo, eventName ) {
			throw new Error('tried to '+triedTo+' a non-existent event type: '+eventName+'. Options are: '+eventTypes.join(', '));
		}

		function addCallback( callbackContainer, enforced, type, callback, isOne ) {
			isOne = !!isOne;
			if (enforced && !callbackContainer[type]) {
				error( 'add', type );
			} else if (!callbackContainer[type]) {
				callbackContainer[type] = [];
			}
			callbackContainer[type].push({callback: callback, isOne: isOne});
		}

		target.on = function (type, callback, isOne) {
			addCallback( events, enforceTypes, type, callback, isOne );
		};
		target.on.enter = function (type, callback, isOne) {
			if (stateStatuses[type]) {
				callback.apply( target, stateArguments[type] );
				if (isOne) {
					return;
				}
			}
			addCallback( enterStateCallbacks, enforceStates, type, callback, isOne );
		};
		target.on.exit = function (type, callback, isOne) {
			if (!stateStatuses[type]) {
				callback.apply( target, stateArguments[type] );
				if (isOne) {
					return;
				}
			}
			addCallback( exitStateCallbacks, enforceStates, type, callback, isOne );
		};

		target.one = function (type, callback) {
			target.on(type, callback, true);
		};
		target.one.enter = function (type, callback) {
			target.on.enter(type, callback, true);
		};
		target.one.exit = function (type, callback) {
			target.on.exit(type, callback, true);
		};

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
		target.off = function (type, callback) {
			removeCallback( events, enforceTypes, type, callback );
		};
		target.off.enter = function (type, callback) {
			removeCallback( enterStateCallbacks, enforceTypes, type, callback );
		};
		target.off.exit = function (type, callback) {
			removeCallback( exitStateCallbacks, enforceTypes, type, callback );
		};


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
				callbacks[i].callback.apply(target, args);
				if (callbacks[i].isOne) {
					target.off(type, callbacks[i].callback);
				}
			}
			// trigger listeners for this type, if any
			if (callbackContainer[type]) {
				args.shift();
				callbacks = callbackContainer[type].slice();
				for (var i = 0; i < callbacks.length; i++){
					callbacks[i].callback.apply(target, args);
					if (callbacks[i].isOne) {
						removeCallback( callbackContainer, false, type, callbacks[i].callback);
					}
				}
			}			
		}

		var trigger = function ( /* type, args... */ ){
			var args = aps.call( arguments );
			triggerCallbacks( events, enforceTypes, args );
		};
		trigger.enter = function(type /*, args */) {
			if (stateStatuses[type]) { return; }
			var args = aps.call(arguments);
			stateStatuses[type] = true;
			stateArguments[type] = args.slice(1);
			triggerCallbacks( enterStateCallbacks, enforceStates, args );
		};
		trigger.exit = function(type /*, args */) {
			if (!stateStatuses[type]) { return; }
			var args = aps.call(arguments);
			stateStatuses[type] = false;
			stateArguments[type] = args.slice(1);
			triggerCallbacks( exitStateCallbacks, enforceStates, args );
		};

		target.on.accepts = function( eventName ) {
			if (enforceTypes) {
				return indexOf( eventTypes, eventName) !== -1;
			} else {
				return true;
			}
		};
		target.on.enter.accepts = target.on.exit.accepts = function( stateName ) {
			if (enforceStates) {
				return indexOf( stateTypes, stateName) !== -1;
			} else {
				return true;
			}
		};

		
		
		trigger.repeat = function( emitter, events ) {
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
		};

		trigger.repeatStates = function( emitter, events ) {
			if (events) {
				for (var i = 0; i < events.length; i += 1) {
					if (target.on.enter.accepts(events[i])) {
						(function (eventName) {
							emitter.on.enter(eventName, function() {
								var args = aps.call(arguments);
								args.unshift(eventName);
								trigger.enter.apply( target, args );
							});
							emitter.on.exit(eventName, function() {
								var args = aps.call(arguments);
								args.unshift(eventName);
								trigger.exit.apply( target, args );
							});
						})(events[i]);
					} else {
						error( 'repeat state', events[i] );
					}
				}
			} else {
				emitter.on.enter('*', function () {
					trigger.enter.apply( target, arguments );
				});
				emitter.on.exit('*', function () {
					trigger.exit.apply( target, arguments );
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
