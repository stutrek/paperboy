(function(factory) {

	if(typeof define === 'function' && define.amd) {
		define(factory);

	} else if(typeof module === 'object' && module.exports) {
		module.exports = factory();
	//GLOBAL
	} else {
		window.paperboy = factory();
	}

})(function() {
	var exports = {};
	exports.mixin = function( target, eventTypes ){
		
		var events = {};
		var enforceTypes = !!eventTypes;
		
		if (eventTypes) {
			eventTypes.forEach(function(type) {
				events[type] = [];
			});
		}
		
		target.on = function (type, callback, isOne) {
			isOne = !!isOne;
			if (enforceTypes && !events[type]) {
				throw new Error('tried to add a non-existent event type: '+type);
			} else if (!events[type]) {
				events[type] = [];
			}
			events[type].push({callback: callback, isOne: isOne});
		};
		
		target.once = target.one = function (type, callback) {
			target.on(type, callback, true);
		};
		
		target.off = function (type, callback) {
			if (enforceTypes && !events[type]) {
				throw new Error('tried to remove a non-existent event type: '+type);
			} else if (!events[type]) {
				return;
			}
			for (var i = 0, callbackObj; callbackObj = events[type][i]; i += 1) {
				if (callbackObj.callback === callback) {
					events[type].splice(i, 1);
					return;
				}
			}
		};
		
		function trigger(type /* , args... */ ){
			if (enforceTypes && !events[type]) {
				throw new Error('tried to trigger a non-existent event type: '+type);
			} else if (!events[type]) {
				return;
			}
			var args = Array.prototype.slice.call(arguments, 1);
			var callbacks = events[type].slice();
			for (var i = 0; i < callbacks.length; i++){
				callbacks[i].callback.apply(target, args);
				if (callbacks[i].isOne) {
					target.off(type, callbacks[i].callback);
				}
			}
		}
		
		return trigger;
	};
	
	exports.emitter = function( eventTypes ) {
		var emitter = {};
		emitter.trigger = exports.mixin(emitter, eventTypes);
		return emitter;
	}
	
	return exports;
});
