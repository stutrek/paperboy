var paperboy;
try {
	paperboy = require('../paperboy');
	var test = require('tape');
} catch(e) {
	paperboy = window.paperboy;
}

test('emitter', function(t) {
	t = t || window;
	
	var mixedin = {"a": 1};
	paperboy.mixin(mixedin);

	t.ok(mixedin.a === 1, 'Passing an object into paperboy.mixin(object) should return the same object augmented with the emitter methods.');
	
	t.end && t.end();
});

test('emitter.on', function(t) {
	t = t || window;
	var emitter = paperboy.emitter(), fired = false, args = [];

	t.equal(typeof emitter.on, 'function', 'emitter.on should be a function.');

	emitter.on('exec', function() { fired = true; });
	emitter.on('exec', function(){ 
		args = Array.prototype.slice.apply(arguments);
	});
	emitter.trigger('exec', 1, 2, 3);

	t.ok(fired, 'emitter.on should fire its callback(s) when the event bound is fired.');
	t.ok(args[0] === 1 && args[1] === 2 && args[2] === 3, 'Any arguments passed into trigger should be passed into the callback(s).');
	t.end && t.end();
});

test('emitter.once', function(t) {
	t = t || window;
	var emitter = paperboy.emitter(), fired;

	t.equal(typeof emitter.once, 'function', 'emitter.once should be a function.');

	emitter.once('exec', function() { fired = true; });
	emitter.trigger('exec');
	if(fired) { fired = 2; }
	emitter.trigger('exec');

	t.ok(fired === 2, 'emitter.once should only fire once. It should delete itself after fired.');
	t.end && t.end();
});

test('emitter.off', function(t) {
	t = t || window;
	var emitter = paperboy.emitter(), fired;

	t.equal(typeof emitter.off, 'function', 'emitter.off should be a function.');
	var listener = function() { fired = true; }
	emitter.on('exec', listener);
	emitter.trigger('exec');
	emitter.off('exec', listener);
	if(fired) { fired = 2; }
	emitter.trigger('exec');

	t.ok(fired === 2, 'events should not be triggered after being removed.');
	t.end && t.end();
});

test('emitter.trigger', function(t) {
	t = t || window;
	var emitter = paperboy.emitter(), results = [];

	t.equal(typeof emitter.trigger, 'function', 'emitter.trigger should be a function.');

	emitter.on('red', function(red) {
		results.push(red);
	});
	emitter.on('blue', function(red, blue) {
		results.push(blue);
	});
	emitter.on('green', function(red, blue, green) {
		results.push(green);
	});
	emitter.on('green', function() {
		results.pop();
	})

	emitter.trigger('red', 'red', 'blue', 'green');
	emitter.trigger('blue', 'red', 'blue', 'green');
	emitter.trigger('green', 'red', 'blue', 'green');

	t.equal(results.toString(), ['red', 'blue'].toString(), "When multiple events are triggered, they should be fired in the correct order.");
	t.end && t.end();
});

// test('emitter.set', function() {
// 	var emitter = paperboy.emitter(), result = '';
// 
// 	equal(typeof emitter.set, 'function', 'emitter.set should be a function.');
// 	equal(typeof emitter.set.clear, 'function', 'emitter.set.clear should be a function.');
// 
// 	emitter.on('event', function() { result += 'Black'; });
// 	emitter.set('event');
// 	emitter.on('event', function() { result += 'White'; });
// 
// 	equal(result, 'BlackWhite', "When multiple events are triggered, they should be fired in the correct order.");
// 
// });
